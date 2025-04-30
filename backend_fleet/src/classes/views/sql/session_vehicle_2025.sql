 SELECT DISTINCT ON (s.id) s.id AS session_id,
    s.sequence_id,
    v."veId" AS veid
   FROM session s
     JOIN history h ON h."sessionId" = s.id
     JOIN vehicles v ON v.id = h."vehicleId"
  WHERE s.sequence_id <> 0 AND h."timestamp" >= '2025-01-01 00:00:00+00'::timestamp with time zone AND h."timestamp" < '2026-01-01 00:00:00+00'::timestamp with time zone;