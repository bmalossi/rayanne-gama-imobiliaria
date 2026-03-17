-- Enable the pg_net extension to allow HTTP requests from within Postgres
create extension if not exists pg_net;

-- Function to notify the webhook when a new lead is generated
create or replace function public.notify_lead_generated()
returns trigger
language plpgsql
security definer
as $$
declare
  payload jsonb;
begin
  -- Build the payload with only necessary IDs
  payload := jsonb_build_object(
    'id', new.id,
    'agent_id', new.agent_id,
    'property_id', new.property_id,
    'name', new.name,
    'email', new.email,
    'phone', new.phone,
    'source', new.source,
    'created_at', new.created_at
  );

  -- Send the HTTP POST request to the n8n webhook
  perform net.http_post(
    url := 'https://webhook.automab.dev/webhook/chat/leadgerado',
    body := payload
  );

  return new;
end;
$$;

-- Trigger to execute the function AFTER INSERT on the leads table
drop trigger if exists on_lead_generated on public.leads;
create trigger on_lead_generated
  after insert on public.leads
  for each row execute function public.notify_lead_generated();
