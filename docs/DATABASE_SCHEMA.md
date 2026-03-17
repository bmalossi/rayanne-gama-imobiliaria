# Database Schema Documentation

The system uses **Supabase (PostgreSQL)** for data storage and management.

## Tables

### `profiles`
Stores user/agent information.
- `id`: UUID (Primary Key, references `auth.users`)
- `full_name`: Text
- `phone`: Text
- `creci`: Text (Regional Real Estate Council ID)
- `bio`: Text
- `avatar_url`: Text
- `created_at`: Timestamptz

### `properties`
Stores real estate listings.
- `id`: UUID (Primary Key)
- `agent_id`: UUID (Foreign Key to `profiles`)
- `title`: Text
- `description`: Text
- `type`: Text (Apartamento, Casa, etc.)
- `transaction`: Text (venda, aluguel)
- `price`: Numeric
- `area`: Numeric
- `status`: Text
- `images`: Text[] (Array of public URLs)
- `active`: Boolean
- `featured`: Boolean (Limit: max 3 per agent)
- `created_at`: Timestamptz

### `leads`
Stores contact requests from potential clients.
- `id`: UUID (Primary Key)
- `agent_id`: UUID (Foreign Key to `profiles`)
- `property_id`: UUID (Foreign Key to `properties`)
- `name`: Text
- `email`: Text
- `phone`: Text
- `message`: Text
- `status`: Enum (Novo, Em Atendimento, Concluído, etc.)
- `created_at`: Timestamptz

### `property_private_details`
Sensitive data related to properties (not visible to public).
- `property_id`: UUID (Primary Key, references `properties`)
- `agent_id`: UUID
- `owner_keys`: Text (Information about keys and owners)

## Row Level Security (RLS)

- **`properties`**: Public read for `active=true` listings. Updates/Deletes restricted to the owner (`agent_id`) or admins.
- **`leads`**: Restricted read/write. Agents can only see leads assigned to them. Public can insert new leads for active properties.
- **`property_private_details`**: Only the owning agent or admin can read/write.

## Relationships
- **Profile -> Property**: One user can have many properties (1:N).
- **Property -> Lead**: One property can generate many leads (1:N).
- **Property -> Private Details**: One property has exactly one set of private details (1:1).

## Storage Buckets
- `property-images`: Public bucket for real estate photos.
- `avatars`: Public bucket for profile pictures.
