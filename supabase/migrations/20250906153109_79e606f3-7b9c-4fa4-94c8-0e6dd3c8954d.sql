-- Remove apartments that are not Padronale, Ghiri, Fienile, Nidi
DELETE FROM apartments 
WHERE name NOT IN ('Padronale', 'Ghiri', 'Fienile', 'Nidi');

-- Also remove any bookings for deleted apartments
DELETE FROM bookings 
WHERE apartment_id NOT IN (
  SELECT id FROM apartments 
  WHERE name IN ('Padronale', 'Ghiri', 'Fienile', 'Nidi')
);