# How to use

Install dependencies
```
bun install
```

Create a config file
```
cp .env.example .env
```

Open config file and add your config
```
NOSTR_PRIVKEY -> private key for bot account
NOSTR_WRITE_RELAYS -> relays use for publish event, seperate by ","
RSS -> rss sources, seperate by ","
```

Run
```
bun start
```

Run with PM2
```
pm2 start --interpreter ~/.bun/bin/bun index.ts
```
