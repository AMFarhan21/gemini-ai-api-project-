import dotenv from "dotenv"
import express from "express"
import multer from "multer";
import fs from "fs/promises"
import { GoogleGenAI } from "@google/genai";
import cors from "cors"
import path from "path";
import { fileURLToPath } from "url";

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const upload = multer()


app.use(express.json())
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')))


const PORT = 3000
app.listen(PORT, () => {
  console.log(`Server ready on http://localhost:${PORT}`)
})



// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const GEMINI_AI_STUDIO_API_KEY = process.env.GEMINI_AI_STUDIO_API_KEY
const ai = new GoogleGenAI({
  apiKey: GEMINI_AI_STUDIO_API_KEY
});

const GEMINI_MODEL = "gemini-2.5-flash"


function extractText(res) {
  try {
    const text = 
      res?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      res?.candidates?.[0]?.content?.parts?.[0]?.text ??
      res?.response?.candidates?.[0]?.content?.text;

      return text ?? JSON.stringify(res, null, 2)

  } catch (error) {

    console.error("Error extracting text: ", error)
    return JSON.stringify(res, null, 2)
    
  }
}

app.post("/generate-text", async(req, res) => {
  try {
    const {prompt} = req.body;
    const resp =  await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt
    })
    res.json({result: extractText(resp)})
  } catch (error) {
    res.status(500).json({error: error.messsage})
  }
})

app.post("/generate-text-from-image", upload.single('image'), async(req, res) => {
  try {
    const {prompt} = req.body
    const file = req.file
    if(!prompt || !file) {
      res.status(400).json({error: "Missing prompt or image"})
      return
    }
    const imageBase64 = req.file.buffer.toString("base64")
    const resp = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {text: prompt},
        {inlineData: {
          mimeType: req.file.mimetype,
          data: imageBase64
        }}
      ]
    })
    res.json({result: extractText(resp)})
  } catch (error) {
    res.status(500).json({error: error.message})
  }
})


app.post("/generate-from-document", upload.single('document'), async(req, res) => {
  try {
    const {prompt} = req.body
    const file = req.file

    // if(!prompt) {
    //   res.status(404).json({error: "Missing prompt"})
    //   return
    // }

    if(!file) {
      res.status(404).json({error: "Missing document"})
      return
    }

    const docBase64 = file.buffer.toString("base64")
    const resp = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {text: prompt || "Ringkas dokumen berikut: "},
        {inlineData: {
          mimeType: file.mimetype,
          data: docBase64
        }}
      ]
    })
    res.json({result: extractText(resp)})
  } catch (error) {
    res.status(500).json({error: error.message})
  }
})


app.post("/generate-from-audio", upload.single("audio"), async(req, res) => {
  try {
    const {prompt} = req.body
    const file = req.file
    if(!file) {
      res.status(404).json({error: "Missing audio file"})
      return
    }
    
    const audioBase64 = file.buffer.toString("base64")
    const resp = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {text: prompt || "Transkrip audio berikut: "},
        { inlineData: {
          mimeType: file.mimetype, 
          data: audioBase64
        }}
      ]
    })

    res.json({result: extractText(resp)})

  } catch (error) {
    res.status(500).json({error: error.message})
  }
})


app.post("/chat", async(req, res) => {
  try {
    const {message} = req.body;
    if(!Array.isArray(message)) throw new Error("messages must be an array")
    const contents = message.map(msg => ({
      role: msg.role,
      parts: [{text: msg.content}]
    }))
    const resp = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents
    })
    res.json({result: extractText(resp)})
  } catch (error) {
    res.status(500).json({error: error.message})
  }
})