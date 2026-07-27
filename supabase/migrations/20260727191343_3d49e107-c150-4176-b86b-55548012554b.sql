insert into public.offer_media (offer_id, media_id, position, is_cover) values
('36c969fb-7600-49c9-889d-fc201f3a3166', 'f09ba99e-8713-4ff1-9275-34b84690b4e0', 1, false),
('36c969fb-7600-49c9-889d-fc201f3a3166', 'aea9c796-76dd-499b-bff8-cbdc927266e2', 2, false),
('36c969fb-7600-49c9-889d-fc201f3a3166', '410eafe6-93a4-437f-86f5-336d662a2989', 3, false)
on conflict (offer_id, media_id) do update
set position = excluded.position,
    is_cover = excluded.is_cover;