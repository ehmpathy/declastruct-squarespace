# browser.stop specification

## .what

stop the persistent browser started via browser.start.

## .why

- clean shutdown of browser and state file
- free system resources
- reset browser state for fresh start

## usage

```sh
rhx browser.stop
rhx browser.stop --session test1
```

## args

| arg | required | default | description |
|-----|----------|---------|-------------|
| --session | no | default | session identifier |

## guarantees

- kills browser process on CDP port
- removes state file
- idempotent (safe if browser already stopped)

## error cases

| scenario | behavior |
|----------|----------|
| no browser active | no-op: no browser found on port |

## cdp port derivation

port is deterministically derived from session name:

```sh
SESSION_HASH=$(echo -n "$SESSION" | md5sum | cut -c1-4)
CDP_PORT=$((9222 + (16#$SESSION_HASH % 778)))
```

this ensures:
- same session always gets same port
- different sessions get different ports
- port range 9222-9999 (778 possible ports)

## implementation

```sh
# derive CDP port from session name hash
SESSION_HASH=$(echo -n "$SESSION" | md5sum | cut -c1-4)
CDP_PORT=$((9222 + (16#$SESSION_HASH % 778)))

# kill browser on CDP port
if fuser "$CDP_PORT/tcp" > /dev/null 2>&1; then
  fuser -k "$CDP_PORT/tcp" > /dev/null 2>&1 || true
  echo "browser stopped"
else
  echo "no browser found on port $CDP_PORT"
fi

# clean up state file
rm -f ".cache/browser.$SESSION/ws-endpoint"
```
