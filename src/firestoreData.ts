import {
  collection,
  doc,
  getDocs,
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
  await setDoc(publicTournamentRef, {
    name: tournament.name,
    format: tournament.format,
    status: tournament.status,
    startDate: tournament.startDate,
    venue: tournament.venue,
    published,
    updatedAt: serverTimestamp()
  }, { merge: true })
  if (!published) return
  const batch = writeBatch(db)
  for (const match of matches) {
    const { id, ...safeMatch } = match
    batch.set(doc(db, 'publicTournaments', tournament.id, 'matches', id), safeMatch)
  }
  for (const standing of standings) {
    const { id, ...safeStanding } = standing
    batch.set(doc(db, 'publicTournaments', tournament.id, 'standings', id), safeStanding)
  }
  await batch.commit()
}
