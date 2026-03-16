import { useEffect, useState } from 'react'
import { supabase, hasSupabase } from '../lib/supabase'

type SupportedTable = 'users' | 'transactions' | 'merchants' | 'admin_users' | 'tickets' | 'support_tickets' | 'portal_messages'

export function useSupabaseRealtime<T extends { id?: string }>(
  table: SupportedTable,
  initialData: T[] = []
) {
  const [data, setData] = useState<T[]>(initialData)
  const [isLive, setIsLive] = useState(false)

  // Update initial data when it changes (e.g., from initial fetch)
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  useEffect(() => {
    if (!hasSupabase || !supabase) return

    setIsLive(true)

    const subscription = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table },
        (payload) => {
          console.log(`Real-time update on ${table}:`, payload)
          
          if (payload.eventType === 'INSERT') {
            setData((current) => [payload.new as T, ...current])
          } else if (payload.eventType === 'UPDATE') {
            setData((current) =>
              current.map((item) =>
                item.id === payload.new.id ? { ...item, ...(payload.new as T) } : item
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setData((current) =>
              current.filter((item) => item.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to ${table} changes`)
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsLive(false)
        }
      })

    return () => {
      if (supabase) {
        supabase.removeChannel(subscription)
      }
      setIsLive(false)
    }
  }, [table])

  return { data, isLive }
}
