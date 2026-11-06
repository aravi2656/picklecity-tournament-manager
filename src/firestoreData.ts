import {
  collection,
  doc,
  getDocs,
  getDoc,
  deleteDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData
} from 'firebase/firestore'
import { db } from './firebase'

export type CloudTournament = {
  id: string
  name: string
  format: string
  status: 'Draft' | 'Upcoming' | 'Live' | 'Completed'
  startDate: string
  venue: string
}
export type CloudPlayer = {
  id: string
  name: string
  phone: string
  category: string
  tournamentId: string
}
export type CloudTeam = {
  id: string
  name: string
  captain: string
  members: string[]
  tournamentId: string
}
export type CloudMatch = {
  id: string
  tournamentId: string
  teamA: string
  teamB: string
  date: string
  court: string
  round: string
  scoreA: number | null
  scoreB: number | null
  status: 'Scheduled' | 'Live' | 'Completed'
}
export type PublicMatch = Omit<CloudMatch, 'tournamentId'> & {
  teamAName: string
  teamBName: string
}
export type PublicStanding = {
  id: string
  teamName: string
  played: number
  wins: number
  losses: number
  points: number
  scoreDifference: number
  rank: number
}

function withId<T>(id: string, data: DocumentData): T {
  return { ...data, id } as T
}

// All cloud writes are explicit calls. This module never reads or migrates demo localStorage.
export async function loadCloudCollection<T>(
  collectionName: 'tournaments' | 'players' | 'teams',
  map: (id: string, data: DocumentData) => T
): Promise<T[]> {
  const snapshot = await getDocs(collection(db, collectionName))
  return snapshot.docs.map(item => map(item.id, item.data()))
}

export const loadTournaments = () =>
  loadCloudCollection('tournaments', (id, data) => withId<CloudTournament>(id, data))
export const loadPlayers = () =>
  loadCloudCollection('players', (id, data) => withId<CloudPlayer>(id, data))
export const loadTeams = () =>
  loadCloudCollection('teams', (id, data) => withId<CloudTeam>(id, data))

export async function loadCloudMatches(tournamentId: string): Promise<CloudMatch[]> {
  const snapshot = await getDocs(collection(db, 'tournaments', tournamentId, 'matches'))
  return snapshot.docs.map(item => withId<CloudMatch>(item.id, item.data()))
}

export async function saveCloudTournament(item: CloudTournament): Promise<void> {
  const { id, ...data } = item
  await setDoc(doc(db, 'tournaments', id), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}
export async function saveCloudPlayer(item: CloudPlayer): Promise<void> {
  const { id, ...data } = item
  await setDoc(doc(db, 'players', id), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}
export async function saveCloudTeam(item: CloudTeam): Promise<void> {
  const { id, ...data } = item
  await setDoc(doc(db, 'teams', id), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}
export async function saveCloudMatch(item: CloudMatch, updatedBy: string): Promise<void> {
  const { id, tournamentId, ...data } = item
  await setDoc(
    doc(db, 'tournaments', tournamentId, 'matches', id),
    { ...data, updatedAt: serverTimestamp(), updatedBy },
    { merge: true }
  )
}

// Public documents are a separate allow-listed projection. Player phone/email and admin fields
// are structurally impossible to pass through this API.
export async function publishPublicSnapshot(
  tournament: CloudTournament,
  matches: PublicMatch[],
  standings: PublicStanding[],
  published: boolean
): Promise<void> {
  const publicTournamentRef = doc(db, 'publicTournaments', tournament.id)
  // Hide the public route while replacing its snapshot. This prevents readers from
  // seeing a partially updated set of matches/standings if a later batch fails.
  await setDoc(publicTournamentRef, {
    name: tournament.name,
    format: tournament.format,
    status: tournament.status,
    startDate: tournament.startDate,
    venue: tournament.venue,
    published: false,
    updatedAt: serverTimestamp()
  }, { merge: true })

  const [oldMatches, oldStandings] = await Promise.all([
    getDocs(collection(db, 'publicTournaments', tournament.id, 'matches')),
    getDocs(collection(db, 'publicTournaments', tournament.id, 'standings'))
  ])

  // Keep each Firestore batch below its 500-write limit.
  const operations: Array<(batch: ReturnType<typeof writeBatch>) => void> = []
  if (!published) {
    oldMatches.docs.forEach(item => operations.push(batch => batch.delete(item.ref)))
    oldStandings.docs.forEach(item => operations.push(batch => batch.delete(item.ref)))
  } else {
    const matchIds = new Set(matches.map(item => item.id))
    const standingIds = new Set(standings.map(item => item.id))
    oldMatches.docs.filter(item => !matchIds.has(item.id)).forEach(item => operations.push(batch => batch.delete(item.ref)))
    oldStandings.docs.filter(item => !standingIds.has(item.id)).forEach(item => operations.push(batch => batch.delete(item.ref)))
    for (const match of matches) {
      const { id, teamA: _teamA, teamB: _teamB, ...safeMatch } = match
      operations.push(batch => batch.set(doc(db, 'publicTournaments', tournament.id, 'matches', id), safeMatch))
    }
    for (const standing of standings) {
      const { id, ...safeStanding } = standing
      operations.push(batch => batch.set(doc(db, 'publicTournaments', tournament.id, 'standings', id), safeStanding))
    }
  }
  for (let offset = 0; offset < operations.length; offset += 450) {
    const batch = writeBatch(db)
    operations.slice(offset, offset + 450).forEach(operation => operation(batch))
    await batch.commit()
  }
  // Make the new snapshot visible only after every child write succeeds.
  if (published) {
    await setDoc(publicTournamentRef, {
      published: true,
      updatedAt: serverTimestamp()
    }, { merge: true })
  }
}

export async function deleteCloudTournament(id: string): Promise<void> {
  const matches = await getDocs(collection(db, 'tournaments', id, 'matches'))
  const refs = [doc(db, 'tournaments', id), ...matches.docs.map(item => item.ref)]
  for (let offset = 0; offset < refs.length; offset += 450) {
    const batch = writeBatch(db)
    refs.slice(offset, offset + 450).forEach(ref => batch.delete(ref))
    await batch.commit()
  }
}
export async function deleteCloudPlayer(id: string): Promise<void> {
  await deleteDoc(doc(db, 'players', id))
}
export async function deleteCloudTeam(id: string): Promise<void> {
  await deleteDoc(doc(db, 'teams', id))
}
export async function deleteCloudMatch(tournamentId: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'tournaments', tournamentId, 'matches', id))
}

export async function loadPublicSnapshot(tournamentId: string) {
  const parent = await getDoc(doc(db, 'publicTournaments', tournamentId))
  if (!parent.exists() || parent.data().published !== true) return null
  const [matchDocs, standingDocs] = await Promise.all([
    getDocs(collection(db, 'publicTournaments', tournamentId, 'matches')),
    getDocs(collection(db, 'publicTournaments', tournamentId, 'standings'))
  ])
  return {
    tournament: parent.data(),
    matches: matchDocs.docs.map(item => ({ id: item.id, ...item.data() })),
    standings: standingDocs.docs.map(item => ({ id: item.id, ...item.data() }))
  }
}
