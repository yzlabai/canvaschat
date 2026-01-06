## 3. Queue

### Long-running requests
For long-running requests, such as training jobs or models with slower inference times, it is recommended to check the Queue status and rely on Webhooks instead of blocking while waiting for the result.

### Submit a request

The client API provides a convenient way to submit requests to the model.

```ts
import { fal } from "@fal-ai/client";

const { request_id } = await fal.queue.submit("fal-ai/sora-2/text-to-video", {
  input: {
    prompt: "A dramatic Hollywood breakup scene at dusk on a quiet suburban street. A man and a woman in their 30s face each other, speaking softly but emotionally, lips syncing to breakup dialogue. Cinematic lighting, warm sunset tones, shallow depth of field, gentle breeze moving autumn leaves, realistic natural sound, no background music"
  },
  webhookUrl: "https://optional.webhook.url/for/results",
});
```

### Fetch request status

You can fetch the status of a request to check if it is completed or still in progress.

```ts
import { fal } from "@fal-ai/client";

const status = await fal.queue.status("fal-ai/sora-2/text-to-video", {
  requestId: "764cabcf-b745-4b3e-ae38-1200304cf45b",
  logs: true,
});
```

### Get the result

```ts
import { fal } from "@fal-ai/client";

const result = await fal.queue.result("fal-ai/sora-2/text-to-video", {
  requestId: "764cabcf-b745-4b3e-ae38-1200304cf45b"
});
console.log(result.data);
console.log(result.requestId);
import { fal } from "@fal-ai/client";

const status = await fal.queue.status("fal-ai/sora-2/text-to-video", {
  requestId: "764cabcf-b745-4b3e-ae38-1200304cf45b",
  logs: true,
});
```

### Get the result

Once the request is completed, you can fetch the result. See the Output Schema for the expected result format.

```ts
import { fal } from "@fal-ai/client";

const result = await fal.queue.result("fal-ai/sora-2/text-to-video", {
  requestId: "764cabcf-b745-4b3e-ae38-1200304cf45b"
});
console.log(result.data);
console.log(result.requestId);
```

## 4. Files

Some attributes in the API accept file URLs as input. Whenever that's the case you can pass your own URL or a Base64 data URI.

### Data URI (base64)

You can pass a Base64 data URI as a file input. The API will handle the file decoding for you. Keep in mind that for large files, this alternative although convenient can impact the request performance.

### Hosted files (URL)

You can also pass your own URLs as long as they are publicly accessible. Be aware that some hosts might block cross-site requests, rate-limit, or consider the request as a bot.

### Uploading files

We provide a convenient file storage that allows you to upload files and use them in your requests. You can upload files using the client API and use the returned URL in your requests.

```ts
import { fal } from "@fal-ai/client";

const file = new File(["Hello, World!"], "hello.txt", { type: "text/plain" });
const url = await fal.storage.upload(file);
```

### Auto uploads
The client will auto-upload the file for you if you pass a binary object (e.g. File, Data).

Read more about file handling in our file upload guide.