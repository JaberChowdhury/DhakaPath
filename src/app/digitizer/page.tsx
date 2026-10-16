"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Paper,
  Group,
  Stack,
  Badge,
  Button,
  Table,
  Card,
  Grid,
  Select,
  Loader,
  Box,
  TextInput,
  Textarea,
  NumberInput,
  FileInput,
  Divider,
  Alert,
  SimpleGrid,
  Accordion,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import {
  IconScan,
  IconSparkles,
  IconUpload,
  IconCheck,
  IconArrowLeft,
  IconBus,
  IconCoins,
  IconMapPin,
  IconInfoCircle,
  IconRefresh,
  IconShieldCheck,
  IconClock,
} from "@tabler/icons-react";
import { Navbar } from "@/components/layout/Navbar";
import {
  OcrExtractedData,
  OcrDatabaseMatch,
  OcrSubmission,
} from "@/types/digitizer";

export default function DigitizerPage() {
  const [selectedSample, setSelectedSample] =
    useState<string>("sample_bikolpo");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // Extracted Result State
  const [extractedData, setExtractedData] = useState<OcrExtractedData | null>(
    null,
  );
  const [dbMatch, setDbMatch] = useState<OcrDatabaseMatch | null>(null);
  const [rawText, setRawText] = useState<string>("");

  // Editable Form State (Commuter Corrections)
  const [editServiceName, setEditServiceName] = useState("");
  const [editMode, setEditMode] = useState<string>("bus");
  const [editOperator, setEditOperator] = useState("");
  const [editOrigin, setEditOrigin] = useState("");
  const [editDestination, setEditDestination] = useState("");
  const [editVia, setEditVia] = useState("");
  const [editRegularFare, setEditRegularFare] = useState<number | "">("");
  const [editStudentFare, setEditStudentFare] = useState<number | "">("");
  const [editLandmark, setEditLandmark] = useState("");
  const [userNotes, setUserNotes] = useState("");

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<string | null>(
    null,
  );

  // Community Submissions Feed
  const [submissionsList, setSubmissionsList] = useState<OcrSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  const fetchSubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      const res = await fetch("/api/ocr/submissions");
      const data = await res.json();
      if (data.success) {
        setSubmissionsList(data.submissions || []);
      }
    } catch {
      //
    } finally {
      setSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleFileUpload = (file: File | null) => {
    setUploadedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedPreview(url);
    } else {
      setUploadedPreview(null);
    }
  };

  const handleRunOcr = async () => {
    setScanning(true);
    setSubmissionReceipt(null);

    try {
      let imageBase64: string | null = null;
      let mimeType: string = "image/jpeg";

      if (uploadedFile) {
        mimeType = uploadedFile.type || "image/jpeg";
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });
      }

      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          sampleKey: uploadedFile ? undefined : selectedSample,
        }),
      });

      const data = await res.json();
      if (data.success && data.extractedData) {
        const ext = data.extractedData as OcrExtractedData;
        setExtractedData(ext);
        setDbMatch(data.dbMatch);
        setRawText(ext.rawText || "");

        // Populate editable form
        setEditServiceName(ext.serviceName || "");
        setEditMode(ext.mode || "bus");
        setEditOperator(ext.operator || "");
        setEditOrigin(ext.origin || "");
        setEditDestination(ext.destination || "");
        setEditVia(ext.viaStoppages?.join(", ") || "");
        setEditRegularFare(ext.fareRegular !== null ? ext.fareRegular : "");
        setEditStudentFare(ext.fareStudent !== null ? ext.fareStudent : "");
        setEditLandmark(ext.boardingLandmark || "");

        notifications.show({
          title: "Optical Text Extracted",
          message: `Identified ${ext.serviceName || "transit notice"} with ${ext.confidence} confidence.`,
          color: "dark",
        });
      } else {
        notifications.show({
          title: "Extraction Error",
          message: data.error || "Failed to parse transit notice.",
          color: "red",
        });
      }
    } catch {
      notifications.show({
        title: "Network Error",
        message: "Failed to communicate with OCR service.",
        color: "red",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleSubmitForVerification = async () => {
    if (!extractedData) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/ocr/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadedPreview || undefined,
          sampleKey: uploadedFile ? undefined : selectedSample,
          imageName: uploadedFile ? uploadedFile.name : `${selectedSample}.jpg`,
          rawText,
          extractedData: {
            ...extractedData,
            serviceName: editServiceName,
            mode: editMode as any,
            operator: editOperator,
            origin: editOrigin,
            destination: editDestination,
            viaStoppages: editVia
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            fareRegular:
              editRegularFare !== "" ? Number(editRegularFare) : null,
            fareStudent:
              editStudentFare !== "" ? Number(editStudentFare) : null,
            boardingLandmark: editLandmark,
          },
          userCorrection: {
            serviceName: editServiceName,
            mode: editMode as any,
            operator: editOperator,
            origin: editOrigin,
            destination: editDestination,
          },
          userNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmissionReceipt(data.receiptCode);
        notifications.show({
          title: "Submission Received",
          message: `Notice logged as ${data.receiptCode}. Placed in moderation queue for official review.`,
          color: "green",
        });
        fetchSubmissions();
      } else {
        notifications.show({
          title: "Submission Error",
          message: data.error || "Failed to submit notice for review.",
          color: "red",
        });
      }
    } catch {
      notifications.show({
        title: "Network Error",
        message: "Failed to submit notice to server.",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      <Navbar />

      <Container size="lg" py="xl">
        <Stack gap="lg">
          {/* Header Card */}
          <Paper
            p="md"
            radius="lg"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
            }}
          >
            <Group justify="space-between" wrap="wrap" gap="sm">
              <Box>
                <Group gap="xs" mb={4}>
                  <Badge
                    size="xs"
                    radius="xl"
                    variant="filled"
                    style={{
                      background: "var(--text-main)",
                      color: "var(--bg-page)",
                      fontWeight: 700,
                    }}
                  >
                    COMMUNITY TRANSIT DIGITIZER
                  </Badge>
                  <Badge size="xs" variant="outline" color="gray">
                    Human-In-The-Loop OCR
                  </Badge>
                </Group>
                <Title
                  order={2}
                  style={{
                    color: "var(--text-main)",
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                  }}
                >
                  Signboard & Physical Notice Optical Digitizer
                </Title>
                <Text
                  size="xs"
                  style={{ color: "var(--text-muted)", maxWidth: 650 }}
                >
                  Crowdsourced mapping of Dhaka city buses, feeder legunas, and
                  station fare notices. Upload a photo of a street route board
                  or handwritten notice; our Vision AI extracts structured
                  transit metadata for admin verification and network
                  integration.
                </Text>
              </Box>

              <Link href="/admin" style={{ textDecoration: "none" }}>
                <Button
                  size="xs"
                  radius="xl"
                  variant="default"
                  leftSection={<IconShieldCheck size={14} />}
                  styles={{
                    root: {
                      background: "var(--bg-card-inner)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-main)",
                      fontWeight: 600,
                    },
                  }}
                >
                  Admin Verification Portal
                </Button>
              </Link>
            </Group>
          </Paper>

          {/* Success Banner if Submitted */}
          {submissionReceipt && (
            <Alert
              color="green"
              radius="md"
              title="Receipt Code: "
              icon={<IconCheck size={18} />}
            >
              <Text size="sm" fw={700}>
                Receipt Code: {submissionReceipt} — Status: ⏳ Pending Admin
                Review
              </Text>
              <Text size="xs" mt={4}>
                Thank you! Your digitized signboard submission has been sent to
                the DhakaPath moderation queue. Once verified by transport
                administrators against the official route geography, it will be
                published to the live transit network.
              </Text>
            </Alert>
          )}

          {/* Main Grid: Input on Left, Extracted Form on Right */}
          <Grid gap="md">
            {/* Left Column: Image Upload & Samples */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Paper
                p="md"
                radius="lg"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
                  height: "100%",
                }}
              >
                <Stack gap="sm">
                  <Group gap="xs">
                    <IconUpload
                      size={18}
                      style={{ color: "var(--text-main)" }}
                    />
                    <Title
                      order={5}
                      style={{ color: "var(--text-main)", fontWeight: 700 }}
                    >
                      Step 1: Upload Notice Photo
                    </Title>
                  </Group>

                  <FileInput
                    label="Upload Notice Photo"
                    description="Upload street signboard, windshield placard, or fare chart"
                    placeholder="Choose file (.jpg, .png, .webp)"
                    accept="image/*"
                    leftSection={<IconUpload size={16} />}
                    value={uploadedFile}
                    onChange={handleFileUpload}
                    clearable
                    size="xs"
                    styles={{
                      label: {
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                      },
                      input: {
                        background: "var(--bg-card-inner)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-main)",
                      },
                    }}
                  />

                  <Divider
                    label="OR SELECT BENCHMARK NOTICE SAMPLE"
                    labelPosition="center"
                  />

                  <Select
                    label="Preset Dhaka Transit Notice"
                    data={[
                      {
                        value: "sample_bikolpo",
                        label: "🚏 Bikolpo Paribahan Route Placard (Mirpur 10)",
                      },
                      {
                        value: "sample_mrt",
                        label:
                          "🚇 DMTCL Station Concourse Fare Notice (MRT Line 6)",
                      },
                      {
                        value: "sample_leguna",
                        label:
                          "🚐 Rampura Leguna Stand Handwritten Stoppage Board",
                      },
                      {
                        value: "sample_balaka",
                        label:
                          "🚌 Balaka Special Paribahan Route Placard (Sayedabad)",
                      },
                    ]}
                    value={selectedSample}
                    onChange={(v) => setSelectedSample(v || "sample_bikolpo")}
                    size="xs"
                    comboboxProps={{ withinPortal: true, zIndex: 2000 }}
                    styles={{
                      label: {
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                      },
                      input: {
                        background: "var(--bg-card-inner)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-main)",
                      },
                    }}
                  />

                  {/* Photo Preview Box */}
                  {uploadedPreview ? (
                    <Box
                      style={{
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "1px solid var(--border-subtle)",
                        maxHeight: 200,
                        display: "flex",
                        justifyContent: "center",
                        background: "var(--bg-card-inner)",
                      }}
                    >
                      <img
                        src={uploadedPreview}
                        alt="Uploaded Notice Preview"
                        style={{
                          maxHeight: 200,
                          width: "auto",
                          objectFit: "contain",
                        }}
                      />
                    </Box>
                  ) : (
                    <Paper
                      p="sm"
                      radius="md"
                      style={{
                        background: "var(--bg-card-inner)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <Text
                        size="11px"
                        fw={700}
                        style={{ color: "var(--text-main)" }}
                      >
                        {selectedSample === "sample_bikolpo" &&
                          "🚏 Mirpur 10 Acrylic Route Signboard (Bengali)"}
                        {selectedSample === "sample_mrt" &&
                          "🚇 DMTCL Station Concourse Tariff (English & Bengali)"}
                        {selectedSample === "sample_leguna" &&
                          "🚐 Rampura Foot-over Bridge Tin Notice (Bengali)"}
                        {selectedSample === "sample_balaka" &&
                          "🚌 Balaka Special Bus Windshield Placard (Bengali)"}
                      </Text>
                      <Text
                        size="10px"
                        style={{ color: "var(--text-muted)", marginTop: 4 }}
                      >
                        Ready for Vision AI multi-language OCR and structured
                        entity parsing.
                      </Text>
                    </Paper>
                  )}

                  <Button
                    size="sm"
                    radius="xl"
                    leftSection={
                      scanning ? (
                        <Loader size="xs" color="white" />
                      ) : (
                        <IconSparkles size={16} />
                      )
                    }
                    onClick={handleRunOcr}
                    loading={scanning}
                    styles={{
                      root: {
                        background: "var(--text-main)",
                        color: "var(--bg-page)",
                        fontWeight: 600,
                        marginTop: 8,
                      },
                    }}
                  >
                    Run Vision AI OCR Extraction
                  </Button>
                </Stack>
              </Paper>
            </Grid.Col>

            {/* Right Column: Editable Metadata & Database Cross-Validation */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Paper
                p="md"
                radius="lg"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
                  height: "100%",
                }}
              >
                {extractedData ? (
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Box>
                        <Title
                          order={5}
                          style={{ color: "var(--text-main)", fontWeight: 700 }}
                        >
                          Step 2: Review & Correct Extracted Metadata
                        </Title>
                        <Text
                          size="11px"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Human-in-the-loop: Edit any misread characters before
                          submitting for official verification.
                        </Text>
                      </Box>
                      <Badge
                        size="xs"
                        radius="sm"
                        variant="filled"
                        style={{
                          background: "var(--text-main)",
                          color: "var(--bg-page)",
                          fontWeight: 700,
                        }}
                      >
                        Confidence: {extractedData.confidence.toUpperCase()}
                      </Badge>
                    </Group>

                    {/* Database Matching Card */}
                    {dbMatch && (
                      <Paper
                        p="xs"
                        radius="md"
                        style={{
                          background: "var(--bg-card-inner)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <Group gap="xs" mb={2}>
                          <IconMapPin
                            size={15}
                            style={{ color: "var(--text-main)" }}
                          />
                          <Text
                            size="xs"
                            fw={700}
                            style={{ color: "var(--text-main)" }}
                          >
                            DhakaPath Database Cross-Validation:
                          </Text>
                        </Group>
                        <Text
                          size="11px"
                          style={{
                            color: "var(--text-muted)",
                            lineHeight: 1.5,
                          }}
                        >
                          • <strong>Origin Hub:</strong>{" "}
                          {dbMatch.originMatchedHub
                            ? `Matched ${dbMatch.originMatchedHub.name_en} (${dbMatch.originMatchedHub.name_bn})`
                            : "Unmapped / Outside pilot zone"}
                          <br />• <strong>Destination Hub:</strong>{" "}
                          {dbMatch.destinationMatchedHub
                            ? `Matched ${dbMatch.destinationMatchedHub.name_en} (${dbMatch.destinationMatchedHub.name_bn})`
                            : "Unmapped / Outside pilot zone"}
                          <br />• <strong>Corridor Stoppages:</strong>{" "}
                          {dbMatch.matchedStopsCount} stops recognized in
                          network
                          <br />• <strong>Fare Schedule Audit:</strong>{" "}
                          {dbMatch.statutoryFareValidation.auditNote}
                        </Text>
                      </Paper>
                    )}

                    {/* Editable Form */}
                    <SimpleGrid cols={2} spacing="xs">
                      <TextInput
                        size="xs"
                        label="Service Name"
                        value={editServiceName}
                        onChange={(e) =>
                          setEditServiceName(e.currentTarget.value)
                        }
                        required
                      />
                      <Select
                        size="xs"
                        label="Transit Mode"
                        data={[
                          { value: "bus", label: "City Bus" },
                          { value: "metro", label: "Metro Rail" },
                          { value: "leguna", label: "Feeder Leguna" },
                          { value: "rickshaw", label: "Rickshaw Syndicate" },
                        ]}
                        value={editMode}
                        onChange={(v) => setEditMode(v || "bus")}
                      />
                    </SimpleGrid>

                    <TextInput
                      size="xs"
                      label="Operator Syndicate"
                      value={editOperator}
                      onChange={(e) => setEditOperator(e.currentTarget.value)}
                    />

                    <SimpleGrid cols={2} spacing="xs">
                      <TextInput
                        size="xs"
                        label="Origin Terminus"
                        value={editOrigin}
                        onChange={(e) => setEditOrigin(e.currentTarget.value)}
                      />
                      <TextInput
                        size="xs"
                        label="Destination Terminus"
                        value={editDestination}
                        onChange={(e) =>
                          setEditDestination(e.currentTarget.value)
                        }
                      />
                    </SimpleGrid>

                    <TextInput
                      size="xs"
                      label="Via Intermediate Stoppages (Comma separated)"
                      value={editVia}
                      onChange={(e) => setEditVia(e.currentTarget.value)}
                    />

                    <SimpleGrid cols={2} spacing="xs">
                      <NumberInput
                        size="xs"
                        label="Regular Fare (BDT)"
                        description="Observed on notice"
                        value={editRegularFare}
                        onChange={(v) =>
                          setEditRegularFare(v === "" ? "" : Number(v))
                        }
                      />
                      <NumberInput
                        size="xs"
                        label="Student Concession (BDT)"
                        description="Half pass if stated"
                        value={editStudentFare}
                        onChange={(v) =>
                          setEditStudentFare(v === "" ? "" : Number(v))
                        }
                      />
                    </SimpleGrid>

                    <TextInput
                      size="xs"
                      label="Boarding Landmark / Counter"
                      placeholder="e.g. Under foot-over bridge, Police Box counter"
                      value={editLandmark}
                      onChange={(e) => setEditLandmark(e.currentTarget.value)}
                    />

                    <Textarea
                      size="xs"
                      label="Commuter Field Notes"
                      placeholder="Any additional observations about this notice..."
                      rows={2}
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.currentTarget.value)}
                    />

                    {/* Raw OCR Accordion */}
                    <Accordion variant="separated" radius="md">
                      <Accordion.Item value="raw_text">
                        <Accordion.Control>
                          <Text
                            size="xs"
                            fw={600}
                            style={{ color: "var(--text-muted)" }}
                          >
                            View Raw Optical Transcribed Text
                          </Text>
                        </Accordion.Control>
                        <Accordion.Panel>
                          <Box
                            p="xs"
                            style={{
                              background: "var(--bg-card-inner)",
                              borderRadius: 6,
                              fontFamily: "monospace",
                              fontSize: "11px",
                              whiteSpace: "pre-wrap",
                              color: "var(--text-main)",
                            }}
                          >
                            {rawText || "No text"}
                          </Box>
                        </Accordion.Panel>
                      </Accordion.Item>
                    </Accordion>

                    <Group justify="flex-end" mt="xs">
                      <Button
                        size="xs"
                        variant="subtle"
                        color="gray"
                        onClick={() => setExtractedData(null)}
                      >
                        Discard
                      </Button>
                      <Button
                        size="xs"
                        radius="xl"
                        onClick={handleSubmitForVerification}
                        loading={submitting}
                        styles={{
                          root: {
                            background: "var(--text-main)",
                            color: "var(--bg-page)",
                            fontWeight: 600,
                          },
                        }}
                      >
                        Submit for Official Verification
                      </Button>
                    </Group>
                  </Stack>
                ) : (
                  <Box
                    p="xl"
                    style={{
                      border: "1px dashed var(--border-subtle)",
                      borderRadius: 8,
                      textAlign: "center",
                      color: "var(--text-muted)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 320,
                    }}
                  >
                    <IconScan
                      size={36}
                      style={{ marginBottom: 12, opacity: 0.5 }}
                    />
                    <Title
                      order={5}
                      style={{ color: "var(--text-main)", fontWeight: 700 }}
                    >
                      No Notice Scanned Yet
                    </Title>
                    <Text
                      size="xs"
                      style={{
                        color: "var(--text-muted)",
                        maxWidth: 360,
                        marginTop: 4,
                      }}
                    >
                      Select a sample notice or upload a street photo on the
                      left, then click "Run Vision AI OCR Extraction".
                    </Text>
                  </Box>
                )}
              </Paper>
            </Grid.Col>
          </Grid>

          {/* Section: Community OCR Submissions Feed */}
          <Paper
            p="md"
            radius="lg"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
            }}
          >
            <Stack gap="md">
              <Group justify="space-between" wrap="wrap" gap="sm">
                <Box>
                  <Title
                    order={4}
                    style={{ color: "var(--text-main)", fontWeight: 700 }}
                  >
                    Recent Community Signboard Submissions
                  </Title>
                  <Text size="xs" style={{ color: "var(--text-muted)" }}>
                    Track status of crowdsourced transit notices verified by
                    administrators before merging into official routing.
                  </Text>
                </Box>

                <Button
                  size="xs"
                  radius="xl"
                  variant="default"
                  leftSection={<IconRefresh size={14} />}
                  onClick={fetchSubmissions}
                  loading={submissionsLoading}
                  styles={{
                    root: {
                      background: "var(--bg-card-inner)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-main)",
                      fontWeight: 600,
                    },
                  }}
                >
                  Refresh Submissions
                </Button>
              </Group>

              <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ color: "var(--text-main)" }}>
                      Receipt Code
                    </Table.Th>
                    <Table.Th style={{ color: "var(--text-main)" }}>
                      Notice Service
                    </Table.Th>
                    <Table.Th style={{ color: "var(--text-main)" }}>
                      Mode
                    </Table.Th>
                    <Table.Th style={{ color: "var(--text-main)" }}>
                      Corridor
                    </Table.Th>
                    <Table.Th style={{ color: "var(--text-main)" }}>
                      Regular Fare
                    </Table.Th>
                    <Table.Th style={{ color: "var(--text-main)" }}>
                      Verification Status
                    </Table.Th>
                    <Table.Th style={{ color: "var(--text-main)" }}>
                      Submitted At
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {submissionsList.length === 0 ? (
                    <Table.Tr>
                      <Table.Td
                        colSpan={7}
                        style={{ textAlign: "center", padding: "32px" }}
                      >
                        <Text size="sm" style={{ color: "var(--text-muted)" }}>
                          No submissions logged yet. Be the first to upload a
                          signboard!
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    submissionsList.map((sub) => (
                      <Table.Tr key={sub.id}>
                        <Table.Td>
                          <Badge
                            size="xs"
                            radius="sm"
                            variant="outline"
                            style={{
                              borderColor: "var(--border-subtle)",
                              color: "var(--text-main)",
                              background: "var(--bg-card-inner)",
                              fontWeight: 700,
                            }}
                          >
                            {sub.receiptCode}
                          </Badge>
                        </Table.Td>
                        <Table.Td
                          fw={700}
                          style={{ color: "var(--text-main)" }}
                        >
                          {sub.extractedData.serviceName || "Unnamed Service"}
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            size="xs"
                            radius="sm"
                            variant="filled"
                            style={{
                              background: "var(--text-main)",
                              color: "var(--bg-page)",
                              fontWeight: 700,
                            }}
                          >
                            {sub.extractedData.mode.toUpperCase()}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" style={{ color: "var(--text-main)" }}>
                            {sub.extractedData.origin || "?"} ➔{" "}
                            {sub.extractedData.destination || "?"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text
                            size="xs"
                            fw={700}
                            style={{ color: "var(--text-main)" }}
                          >
                            {sub.extractedData.fareRegular !== null
                              ? `${sub.extractedData.fareRegular} ৳`
                              : "N/A"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            size="xs"
                            radius="sm"
                            variant="filled"
                            style={{
                              background:
                                sub.status === "approved"
                                  ? "#00aa66"
                                  : sub.status === "rejected"
                                    ? "#e11900"
                                    : "var(--text-main)",
                              color: "var(--bg-page)",
                              fontWeight: 700,
                            }}
                          >
                            {sub.status === "approved"
                              ? "● Verified & Published"
                              : sub.status === "rejected"
                                ? "○ Rejected"
                                : "⏳ Pending Review"}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text
                            size="11px"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {new Date(sub.submittedAt).toLocaleDateString()}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
