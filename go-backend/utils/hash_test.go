package utils

import "testing"

func TestGenerateSHA256FromBytes(t *testing.T) {
	data := []byte("CryptoVault test")
	hash := GenerateSHA256FromBytes(data)
	if len(hash) != 64 {
		t.Errorf("Expected 64 chars, got %d", len(hash))
	}
	t.Logf("✅ Hash: %s...", hash[:16])
}

func TestHashConsistency(t *testing.T) {
	data  := []byte("Same data")
	hash1 := GenerateSHA256FromBytes(data)
	hash2 := GenerateSHA256FromBytes(data)
	if hash1 != hash2 {
		t.Error("❌ Same data should give same hash")
	}
	t.Logf("✅ Consistency passed")
}

func TestHashUniqueness(t *testing.T) {
	hash1 := GenerateSHA256FromBytes([]byte("Original content"))
	hash2 := GenerateSHA256FromBytes([]byte("Tampered content"))
	if hash1 == hash2 {
		t.Error("❌ Different data should give different hash")
	}
	t.Logf("✅ Tamper detection passed")
}

func TestTamperDetection(t *testing.T) {
	original := []byte("Blood Type A+, Dose 500mg")
	tampered := []byte("Blood Type B+, Dose 500mg")
	if GenerateSHA256FromBytes(original) == GenerateSHA256FromBytes(tampered) {
		t.Error("❌ Tamper not detected!")
	}
	t.Logf("✅ Tamper detected ⚠️")
}

func TestEmptyHash(t *testing.T) {
	hash := GenerateSHA256FromBytes([]byte(""))
	expected := "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
	if hash != expected {
		t.Errorf("Expected %s, got %s", expected, hash)
	}
	t.Logf("✅ Empty hash correct")
}