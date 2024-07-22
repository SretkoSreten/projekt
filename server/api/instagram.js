const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
require("dotenv").config();

const router = express.Router();
const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;

router.post("/", async (req, res) => {
  const { title, text } = req.body;

  try {
    let imageUrl = "";
    if (req.file) {
      const imgurFormData = new FormData();
      imgurFormData.append("image", fs.createReadStream(req.file.path));

      const imgurResponse = await axios.post(
        "https://api.imgur.com/3/upload",
        imgurFormData,
        {
          headers: {
            Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
            ...imgurFormData.getHeaders(),
          },
        }
      );

      imageUrl = imgurResponse.data.data.link;
    }

    const mediaData = {
      image_url: imageUrl,
      caption: `${title}\n\n${text}`,
      access_token: PAGE_ACCESS_TOKEN,
    };

    const mediaResponse = await axios.post(
      `https://graph.facebook.com/v20.0/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`,
      mediaData
    );

    const mediaId = mediaResponse.data.id;

    const publishData = {
      creation_id: mediaId,
      access_token: PAGE_ACCESS_TOKEN,
    };

    const publishResponse = await axios.post(
      `https://graph.facebook.com/v20.0/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media_publish`,
      publishData
    );

    return res
      .status(200)
      .json({ success: true, postId: publishResponse.data.id });
  } catch (e) {
    return res.status(500).send("Error posting to Instagram");
  }
});

module.exports = router;
