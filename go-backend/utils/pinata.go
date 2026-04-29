package utils

import (
  "bytes"
  "encoding/json"
  "fmt"
  "io"
  "mime/multipart"
  "net/http"
  "os"
)

type PinataResponse struct {
  IpfsHash  string `json:"IpfsHash"`
  PinSize   int    `json:"PinSize"`
  Timestamp string `json:"Timestamp"`
}

func UploadToPinata(fileData []byte, filename string) (string, string, error) {
  jwt := os.Getenv("PINATA_JWT")
  if jwt == "" {
    jwt = os.Getenv("PINATA_API_KEY")
  }
  if jwt == "" {
    // Mock CID and URL
    mockCID := "mock_cid_" + filename
    return fmt.Sprintf("https://gateway.pinata.cloud/ipfs/%s", mockCID), mockCID, nil
  }

  // Multipart form banva
  body := &bytes.Buffer{}
  writer := multipart.NewWriter(body)

  // File part add kara
  part, err := writer.CreateFormFile("file", filename)
  if err != nil {
    return "", "", err
  }
  _, err = io.Copy(part, bytes.NewReader(fileData))
  if err != nil {
    return "", "", err
  }

  // Metadata add kara
  metadata := fmt.Sprintf(`{"name":"%s","keyvalues":{"app":"CryptoVault"}}`, filename)
  _ = writer.WriteField("pinataMetadata", metadata)
  _ = writer.WriteField("pinataOptions", `{"cidVersion":1}`)
  writer.Close()

  // Request banva
  req, err := http.NewRequest("POST",
    "https://api.pinata.cloud/pinning/pinFileToIPFS", body)
  if err != nil {
    return "", "", err
  }

  req.Header.Set("Authorization", "Bearer "+jwt)
  req.Header.Set("Content-Type", writer.FormDataContentType())

  // Send kara
  client := &http.Client{}
  resp, err := client.Do(req)
  if err != nil {
    return "", "", err
  }
  defer resp.Body.Close()

  // Response parse kara
  var pinataResp PinataResponse
  if err := json.NewDecoder(resp.Body).Decode(&pinataResp); err != nil {
    return "", "", err
  }

  if pinataResp.IpfsHash == "" {
    return "", "", fmt.Errorf("pinata upload failed")
  }

  gateway := os.Getenv("PINATA_GATEWAY")
  if gateway == "" {
    gateway = "https://gateway.pinata.cloud"
  }

  return fmt.Sprintf("%s/ipfs/%s", gateway, pinataResp.IpfsHash), pinataResp.IpfsHash, nil
}
