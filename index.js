const { app, BrowserWindow, Notification, clipboard } = require("electron");
const axios = require("axios");
const fs = require("fs");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });

  win.loadFile("index.html");
}

let localClipboard = null;
let serverClipboard = null;

async function getServerClipboard() {
  const config = {
    method: "post",
    url: "https://570xspmxwa.execute-api.us-east-1.amazonaws.com/paste?token=1023571058",
    headers: {
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      token: "1023571058",
    }),
  };

  const { data } = await axios(config);
  return data.contents;
}

async function writeToGlobal(text, summarize) {
  const data = JSON.stringify({
    token: "1023571058",
    contents: text,
    summarize: summarize ? "True" : "False",
  });

  const config = {
    method: "post",
    url: "https://570xspmxwa.execute-api.us-east-1.amazonaws.com/copy",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  const res = await axios(config);
  return summarize ? res.data.summary: res.data.contents;
}

const notifiedFor = new Set();

const hash = require("object-hash");

async function listenToClipboard() {
  if (localClipboard === null || serverClipboard === null) {
    serverClipboard = await getServerClipboard();
    localClipboard = clipboard.readText();
  }

  if (clipboard.availableFormats().some((a) => a.startsWith("image"))) {
    const f = clipboard.readImage().toPNG();

    const h = hash(f);

    if (!notifiedFor.has(h)) {
      notifiedFor.add(h);
      fs.writeFileSync("clip.png", clipboard.readImage().toPNG());
      const vision = require("@google-cloud/vision");

      const client = new vision.ImageAnnotatorClient({
        projectId: "hack-rpi-331411",
        credentials: {
          type: "service_account",
          project_id: "hack-rpi-331411",
          private_key_id: "98e92852aaa69cafa5e6ede0accc7e13db102e75",
          private_key:
            "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDeEeDlhYHq9bAL\n5ixB2WgIsqILQJfpTw/I46Gep/HYrTXgW3VWw6rQwc2Ui0uNlSmOKbhl9K5odA1T\nqcCGYZkv5Oi4Mw7zD+//SlEc/rnD/aY5E0vkCItwxcyYhTFsMORgpJ0xvEM9kUsV\nyX+hEU6iOyrvc4meApI9p9U2aF1FODuY3fr+qNPCmDY7Nm/SWRgIRE3b2VS8rsfV\n3E5Nh6pnX2iavRVP5qCPAkrz+nD3nqhm4ZovggZxkTio4+ge210zR5Ib573KULoI\n9KxuoKmvwh10wkHuuDVcatnDWZ3+unYDyJivH+/sXkq/EQNosPjITBS/n351AWJ9\npppmu9kFAgMBAAECggEAA0nt/qWIcUeetL+9qjhTSq+vPS3sIgaA+Wy/mmx/z9bu\n3D9WgJ4IuVXpcBipBN7aPPKqul3SOGtMPY/fG/kK46icTAq7ibIpJSrUrTKA40wY\nylxvYbWWWmmfgvxpU+Ice77sXLhzoXrgSwwPJxOXynNzCmqiYDPxtlaLjpD4nVC1\nu/6XtAZiAryJcbYbeAmE2PbUmj9F7cv3ousE4rR3f9rnz6V8jJixbfUvXLmooSB3\n6D/uH9Don9huta/kya3i0tJb5bNQS9Z6tz7aUl009wH6k1/y3r03fxe/cM8va4/V\npaJrqwh9J+yOgZ9Mkw5Y+4wMLZcnSNnHCxBzmLA7YQKBgQD0y2cANWomDQ7oLBg3\n5s5jKHy6gi3g0KznYhVkm12BsGcfZMr+sCW3id9Km6vwUg6ywXEKCOwC2cfetxmi\n3MdXcwWL4NtpREeyRSa2Puw4IN+3AykYN4VKkv1tkWCqB3+UIaWeGnQXgj/tBbeV\n36xY3wn+mxXn8+McJamuFbka4QKBgQDoPC3jY/XwCPWj5BycPgN+nDXaaa6STTrY\nJvAtUCEX5zJmpm0fz829WaQoqGVbI77EjTHdm+JSbwryYzkfMRBZ4Rd6uwDmyCqD\neXNMfPqJ5jQT1oBqOJf8DB2xVDS4xk0uNKzjjtlhvviOmqaXZrS9TdosCtJJVPG6\nPdVRH5RGpQKBgB7YangqQt/ckV5MABk7KhJwjZbqxGEpqj/VqiBtO1EWK0hXaQTC\nqV4BL3O1PesgS93WZin/ic2qJ3c21zIgY7XvNmmzwbH3+pjKAeDA+P7xlX74FPuK\nM298KhbeVLHYFAlUXAwaBTrZHLj/GWz3LD5ejGHapN3/a0SmskTPU+3BAoGBAKeM\n+4KKVR8oJ6ll46pqJ3VKWKRLCRMuuxzGAxR+MlIfkMJ0oliIQaSyLvjSfcXipTkD\nsY10cTYOPXShV84ERQrDloAKuVzH37xZfHEb3lpthvclFCMOz8CeMTIGUb9Z+scy\nY+YN4xJdiNDCDR1AkXfe2mBaMluL+JbpE6VixkStAoGBAK86GkEzCcKfdllffIm5\nI57zwA6dEggCFgV5PYpsXqeyuurjehkC9RqNO+FgJC77o7rH5hOyfxlVDbD+mNli\nfVf4/UKT9wM06fEsYU1Yl5tHPIfjDtJeo2k8FxGntjGW0Cjw5eoUDcW5EI7KkfUl\naboEPYaeSYxLR4EWQ38WTu7g\n-----END PRIVATE KEY-----\n",
          client_email: "images@hack-rpi-331411.iam.gserviceaccount.com",
          client_id: "115941720570580196758",
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url:
            "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url:
            "https://www.googleapis.com/robot/v1/metadata/x509/images%40hack-rpi-331411.iam.gserviceaccount.com",
        },
      });

      // Performs text detection on the local file
      const [result] = await client.textDetection("clip.png");
      const detections = result.textAnnotations;
      const text = detections.map((text) => text.description).join(" ").trim();

      if(text){
        const notification = new Notification({
          title: "Image can be transcribed",
          body: "Text was detected in the image you copied. Click here to copy the text to your clipboard.",
        });

        notification.on("click", async () => {
          clipboard.writeText(text);
          serverClipboard = await writeToGlobal(text, false);
          notifiedFor.add(text);
          localClipboard = serverClipboard;
        });

        notification.show();
      }
    }
  } else {
    const newServer = await getServerClipboard();
    const newLocal = clipboard.readText();

    if (newServer !== serverClipboard) {
      clipboard.writeText(newServer);
      serverClipboard = newServer;
      localClipboard = newLocal;
    } else if (newLocal !== localClipboard) {
      await writeToGlobal(newLocal);

      if (newLocal.length > 200 && !notifiedFor.has(newLocal)) {
        notifiedFor.add(newLocal);
        const notification = new Notification({
          title: "Text can be simplified",
          body: "The text in your clipboard is looking long. Click here and we'll simplify it for you!",
        });

        notification.on("click", async () => {
          serverClipboard = await writeToGlobal(newLocal, true);
          notifiedFor.add(serverClipboard)
          clipboard.writeText(serverClipboard);
          localClipboard = serverClipboard;
        });

        notification.show();
      }
    }
  }
  setTimeout(listenToClipboard, 500);
}

app.whenReady().then(() => {
  createWindow();

  listenToClipboard();
});

