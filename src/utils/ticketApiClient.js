/**
 * Ticket API Client for verification and data fetching
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/tickets`;
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function getHeaders(contentType = 'application/json') {
  return {
    apikey: API_KEY,
    Authorization: `Bearer ${API_KEY}`,
    ...(contentType && { 'Content-Type': contentType }),
  };
}

// CREATE
export async function createTicket(ticketData) {
  // Store PNR and all fields as entered by the user
  const data = { ...ticketData };
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error('Failed to create ticket');
  }
  return res.json();
}

// READ (all or with filters)
export async function getTickets(query = '') {
  const res = await fetch(`${API_URL}${query}`, {
    headers: getHeaders(null),
  });
  if (!res.ok) {
    throw new Error('Failed to fetch tickets');
  }
  return res.json();
}

// UPDATE
export async function updateTicket(ticketId, updates) {
  const res = await fetch(`${API_URL}?id=eq.${ticketId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    throw new Error('Failed to update ticket');
  }
  return res.json();
}

// DELETE
export async function deleteTicket(ticketId) {
  const res = await fetch(`${API_URL}?id=eq.${ticketId}`, {
    method: 'DELETE',
    headers: getHeaders(null),
  });
  if (!res.ok) {
    throw new Error('Failed to delete ticket');
  }
  return res.json();
}

// --- External Supabase API for Ticket Verification ---
const EXTERNAL_API_URL = 'https://ftsboryogzngqfarbbgu.supabase.co/rest/v1/tickets';
const EXTERNAL_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0c2JvcnlvZ3puZ3FmYXJiYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzM0NTEsImV4cCI6MjA2ODkwOTQ1MX0.idJ82x2P4BqQ1VffwQ5nnFYWtGIIo_H8kTidAGhwV0A';

function getExternalHeaders(contentType = 'application/json') {
  return {
    apikey: EXTERNAL_API_KEY,
    Authorization: `Bearer ${EXTERNAL_API_KEY}`,
    ...(contentType && { 'Content-Type': contentType }),
  };
}

// Verify a ticket by PNR number and ticket type from the correct external table (new schema)
export async function verifyExternalTicketNewSchema({ ticketType, pnr_number }) {
  // Use PNR as entered by the user
  let url;
  if (ticketType === 'bus') {
    url = `${EXTERNAL_API_URL}?pnr_number=eq.${encodeURIComponent(pnr_number)}`;
  } else if (ticketType === 'plane') {
    url = `${EXTERNAL_API_URL}?pnr_number=eq.${encodeURIComponent(pnr_number)}`;
  } else if (ticketType === 'train') {
    url = `${EXTERNAL_API_URL}?pnr_number=eq.${encodeURIComponent(pnr_number)}`;
  } else {
    throw new Error('Invalid ticket type');
  }
  const res = await fetch(url, {
    headers: getExternalHeaders(null),
  });
  if (!res.ok) {
    throw new Error('Failed to verify external ticket');
  }
  const data = await res.json();
  return data && data.length > 0 ? data[0] : null;
}

// Debug: Fetch ticket by PNR from both 'tickets' and 'bus_tickets' tables
export async function debugFetchExternalTicketByPNR(pnr_number) {
  // Try 'tickets' table
  const ticketRes = await fetch(`${EXTERNAL_API_URL}?pnr_number=eq.${encodeURIComponent(pnr_number)}`, {
    headers: getExternalHeaders(null),
  });
  const ticketData = ticketRes.ok ? await ticketRes.json() : [];

  // Try 'bus_tickets' table
  const BUS_TICKETS_URL = 'https://ftsboryogzngqfarbbgu.supabase.co/rest/v1/bus_tickets';
  const busRes = await fetch(`${BUS_TICKETS_URL}?pnr_number=eq.${encodeURIComponent(pnr_number)}`, {
    headers: getExternalHeaders(null),
  });
  const busData = busRes.ok ? await busRes.json() : [];

  return { ticketData, busData };
}

// Sync local tickets with external API
export async function syncLocalTicketsWithExternal() {
  // Fetch all tickets from all external tables
  const [busRes, planeRes, trainRes] = await Promise.all([
    fetch(EXTERNAL_API_URL, { headers: getExternalHeaders(null) }),
    fetch(EXTERNAL_API_URL, { headers: getExternalHeaders(null) }),
    fetch(EXTERNAL_API_URL, { headers: getExternalHeaders(null) })
  ]);
  const busTickets = busRes.ok ? await busRes.json() : [];
  const planeTickets = planeRes.ok ? await planeRes.json() : [];
  const trainTickets = trainRes.ok ? await trainRes.json() : [];
  const externalPNRs = new Set([
    ...busTickets.map(t => t.pnr_number),
    ...planeTickets.map(t => t.pnr_number),
    ...trainTickets.map(t => t.pnr_number)
  ]);

  // Fetch all tickets from local database
  const localRes = await fetch(API_URL, {
    headers: getHeaders(null),
  });
  const localTickets = localRes.ok ? await localRes.json() : [];

  // Find local tickets not present in any external table (case-sensitive, as backend is now case-insensitive)
  const ticketsToDelete = localTickets.filter(t => !externalPNRs.has(t.pnr_number));

  // Delete those tickets from local database
  for (const ticket of ticketsToDelete) {
    try {
      console.log('Attempting to delete local ticket not in any external table:', ticket);
      const delRes = await fetch(`${API_URL}?id=eq.${ticket.id}`, {
        method: 'DELETE',
        headers: getHeaders(null),
      });
      if (!delRes.ok) {
        const errText = await delRes.text();
        console.error('Failed to delete ticket:', ticket, 'Response:', errText);
      } else {
        console.log('Successfully deleted ticket:', ticket);
      }
    } catch (err) {
      console.error('Error deleting ticket:', ticket, err);
    }
  }
  return ticketsToDelete;
}

// Verify a ticket by PNR (case-insensitive) in unified tickets table
export async function verifyTicketUnified({ pnr_number }) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .ilike('pnr_number', pnr_number)
    .single();
  if (error) return null;
  return data;
}

// List tickets by type (case-insensitive) in unified tickets table
export async function listTicketsByType(type) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .ilike('transport_mode', type)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data;
}