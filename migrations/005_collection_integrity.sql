CREATE UNIQUE INDEX IF NOT EXISTS collection_items_unique_saved_item ON collection_items(user_id,collection_id,item_type,item_id);
CREATE INDEX IF NOT EXISTS collection_items_collection_lookup ON collection_items(collection_id,user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS saved_collections_user_created ON saved_collections(user_id,created_at DESC);