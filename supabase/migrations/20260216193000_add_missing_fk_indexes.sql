create index if not exists idx_character_relationships_category
on public.character_relationships(category_id);

create index if not exists idx_character_relationships_label_preset
on public.character_relationships(label_preset_id);

create index if not exists idx_notifications_source_character
on public.notifications(source_character_id);

create index if not exists idx_notifications_target_character
on public.notifications(target_character_id);

create index if not exists idx_relationship_timeline_entries_owner
on public.relationship_timeline_entries(owner_user_id);
