import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const rules = await readFile('firestore.rules', 'utf8')
const env = await initializeTestEnvironment({
  projectId: 'demo-picklecity-rules',
  firestore: { rules }
})
try {
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore()
    await setDoc(doc(db, 'admins', 'root'), { email: 'root@example.test', role: 'super_admin', active: true })
    await setDoc(doc(db, 'admins', 'scorer'), { email: 'scorer@example.test', role: 'score_admin', active: true })
    await setDoc(doc(db, 'admins', 'inactive'), { email: 'inactive@example.test', role: 'super_admin', active: false })
    await setDoc(doc(db, 'publicTournaments', 'event1'), {
      name: 'Test Event', format: 'League', status: 'Live', startDate: '', venue: '',
      published: true
    })
  })

  const anonymous = env.unauthenticatedContext().firestore()
  const root = env.authenticatedContext('root').firestore()
  const scorer = env.authenticatedContext('scorer').firestore()
  const inactive = env.authenticatedContext('inactive').firestore()

  await assertFails(getDoc(doc(anonymous, 'players', 'p1')))
  await assertSucceeds(getDoc(doc(root, 'admins', 'root')))
  await assertSucceeds(setDoc(doc(root, 'players', 'p1'), {
    name: 'Player', phone: 'private', category: 'Open', tournamentId: 'event1'
  }))
  await assertFails(setDoc(doc(scorer, 'players', 'p2'), { name: 'No access' }))
  await assertFails(getDoc(doc(inactive, 'tournaments', 'event1')))

  await assertSucceeds(setDoc(doc(scorer, 'tournaments', 'event1', 'matches', 'm1'), {
    teamA: 'a', teamB: 'b', date: '', court: '', round: 'R1',
    scoreA: 11, scoreB: 8, status: 'Completed'
  }))
  await assertFails(setDoc(doc(scorer, 'publicTournaments', 'event1', 'matches', 'm1'), {
    teamAName: 'A', teamBName: 'B', date: '', court: '', round: 'R1',
    scoreA: 11, scoreB: 8, status: 'Completed'
  }))
  await assertSucceeds(getDoc(doc(anonymous, 'publicTournaments', 'event1')))
  await assertFails(setDoc(doc(anonymous, 'publicTournaments', 'event1'), { published: false }))
  await assertFails(setDoc(doc(root, 'publicTournaments', 'event1', 'matches', 'bad'), {
    teamAName: 'A', teamBName: 'B', phone: 'must-not-pass', date: '', court: '',
    round: 'R1', scoreA: 1, scoreB: 0, status: 'Completed'
  }))
  console.log('Firestore rules tests passed.')
} finally {
  await env.cleanup()
}
