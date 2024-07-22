const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
require("dotenv").config();

const router = express.Router();
const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

router.post("/", async (req, res) => {
  const { title, text } = req.body;

  try {
    let imageUrl = "";
    if (req.file) {
      const formData = new FormData();
      formData.append("access_token", PAGE_ACCESS_TOKEN);
      formData.append("source", fs.createReadStream(req.file.path));
      const uploadResponse = await axios.post(
        `https://graph.facebook.com/v20.0/${PAGE_ID}/photos`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      imageUrl = uploadResponse.data.url;
    }

    // Pripravite podatke za objavo
    let postData = {
      access_token: PAGE_ACCESS_TOKEN,
      message: `${title}\n\n${text}`,
    };

    // Če je bila naložena slika, jo priložite k sporočilu
    if (imageUrl) {
      postData = {
        ...postData,
        attached_media: [{ media: { image_url: imageUrl } }],
      };
    }

    // Objavite na Facebook stran
    const postResponse = await axios.post(
      `https://graph.facebook.com/v20.0/${PAGE_ID}/feed`,
      postData
    );

    return res
      .status(200)
      .json({ success: true, postId: postResponse.data.id });
  } catch (e) {
    return res.status(500).send("Error posting to Instagram");
  }
});

module.exports = router;
