import { io } from 'socket.io-client'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const secureSocket = apiUrl.startsWith('https://')

console.log('Frontend usando API_URL:', apiUrl)

export const API_URL = apiUrl
export const socket = io(API_URL, {
  secure: secureSocket,
})