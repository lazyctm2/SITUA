import { io } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'https://situa.onrender.com'
const secureSocket = API_URL.startsWith('https://')

console.log('Frontend usando API_URL:', API_URL)

export const API_URL = API_URL
export const socket = io(API_URL, {
  secure: secureSocket,
})