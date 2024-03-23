import {
	ClientBuilder,
	ClientSigner,
	Keys,
	SecretKey,
	Tag,
	loadWasmAsync,
} from "@rust-nostr/nostr-sdk";
import { decode } from "html-entities";
import RssFeedEmitter from "rss-feed-emitter";

const feeder = new RssFeedEmitter();

async function run() {
	const nsec = Bun.env.NOSTR_PRIVKEY;
	const writeRelays = Bun.env.NOSTR_WRITE_RELAYS?.split(",");
	const sources = Bun.env.RSS?.split(",");
	const hashtags = Bun.env.HASHTAGS?.split(",");
	const autoLink = Bun.env.AUTO_INSERT_LINK
		? Bun.env.AUTO_INSERT_LINK === "true"
		: false;

	if (!nsec) {
		console.log("You need to set up nsec to use Sentinel.");
		return;
	}

	if (!writeRelays) {
		console.log("You need to set up write relay to use Sentinel.");
		return;
	}

	if (!sources?.length) {
		console.log("You need to set up at least 1 RSS to use Sentinel.");
		return;
	}

	// fetch rss
	try {
		// load nostr
		await loadWasmAsync();

		// init signer
		const secretKey = SecretKey.fromBech32(nsec);
		const keys = new Keys(secretKey);
		const signer = ClientSigner.keys(keys);

		// init client
		const client = new ClientBuilder().signer(signer).build();

		// add relay
		await client.addRelays(writeRelays);
		await client.connect();

		feeder.add({
			url: sources,
			refresh: 300000, // 5 minutes
			eventName: "event",
		});

		feeder.on("event", async (item) => {
			let content: string =
				item.summary || item.description || item.title || "";
			let tag: Tag[] = [];

			// decode html entities
			content = decode(content);

			// convert html to line break
			content = content
				.replace(/(<(br[^>]*)>)/gi, "\n")
				.replace(/(<(p[^>]*)>)/gi, "\n")
				.replace(/(<([^>]+)>)/gi, "");

			// make sure no html remains
			content = content.replace(/<[^>]*>?/gm, "");

			// add hashtag to content
			if (hashtags?.length) {
				content = `${content}\n${hashtags.join(" ")}`;
				tag = hashtags.map((tag) =>
					Tag.parse(["t", tag.toLowerCase().replace("#", "")]),
				);
			}

			// add source link to content
			if (autoLink) content = `${content}\n${item.link}`;

			// trim
			content = content.trim();

			try {
				const event = await client.publishTextNote(content, tag);
				console.log("published event:", `https://njump.me/${event.toBech32()}`);
			} catch (e) {
				console.error(e);
			}
		});
	} catch (e) {
		console.error(String(e));
	}
}

// LFG !!!
run();
