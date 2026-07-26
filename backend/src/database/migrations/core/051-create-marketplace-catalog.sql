CREATE TABLE marketplace_plugins
(
    id uuid PRIMARY KEY,

    plugin_id uuid
        REFERENCES plugins(id)
        ON DELETE SET NULL,

    slug varchar(150) NOT NULL UNIQUE,

    name varchar(255) NOT NULL,

    vendor varchar(255) NOT NULL,

    latest_version varchar(40) NOT NULL,

    description text,

    category varchar(80),

    icon_url text,

    homepage text,

    repository text,

    verified boolean NOT NULL DEFAULT false,

    published_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),

    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketplace_plugins_slug
ON marketplace_plugins(slug);

CREATE INDEX idx_marketplace_plugins_category
ON marketplace_plugins(category);
