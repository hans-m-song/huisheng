schema "main" {
}

table "song" {
  schema = schema.main

  column "songId" {
    type = text
    null = false
  }

  column "songTitle" {
    type = text
    null = false
  }

  column "songUrl" {
    type = text
    null = false
  }

  column "artistId" {
    type = text
    null = true
  }

  column "artistTitle" {
    type = text
    null = true
  }

  column "artistUrl" {
    type = text
    null = true
  }

  column "thumbnail" {
    type = text
    null = true
  }

  column "duration" {
    type = integer
    null = true
  }

  column "cachedAt" {
    type    = integer
    null    = false
    default = "(strftime('%s', 'now'))"
  }

  primary_key {
    columns = [column.songId]
  }
}

table "queue" {
  schema = schema.main

  column "channelId" {
    type = text
    null = false
  }

  column "sortOrder" {
    type = integer
    null = false
  }

  column "songId" {
    type = text
    null = false
  }

  column "played" {
    type    = boolean
    null    = false
    default = false
  }

  primary_key {
    columns = [column.channelId, column.sortOrder]
  }

  foreign_key "songId" {
    columns     = [column.songId]
    ref_columns = [table.song.column.songId]
    on_update   = CASCADE
    on_delete   = CASCADE
  }
}

table "query" {
  schema = schema.main

  column "queryId" {
    type           = integer
    null           = false
    auto_increment = true
  }

  column "query" {
    type = text
    null = false
  }

  column "songId" {
    type = text
    null = false
  }

  column "hits" {
    type    = integer
    null    = false
    default = 1
  }

  primary_key {
    columns = [column.queryId]
  }

  index "index_query" {
    columns = [column.query]
    unique  = true
  }

  check "query_length" {
    expr = "length(query) > 0"
  }
}
