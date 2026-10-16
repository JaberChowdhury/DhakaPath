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
  Tabs,
  ActionIcon,
  Tooltip,
  Card,
  Grid,
  Select,
  Loader,
  Box,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Switch,
  MultiSelect,
  SegmentedControl,
  FileInput,
  Divider,
  Alert,
  SimpleGrid,
  Accordion,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconShieldLock,
  IconCheck,
  IconX,
  IconBus,
  IconArrowLeft,
  IconCoins,
  IconScan,
  IconSparkles,
  IconLogout,
  IconKey,
  IconRefresh,
  IconCpu,
  IconTrash,
  IconPlus,
  IconEdit,
  IconAlertTriangle,
  IconUpload,
  IconSearch,
  IconLayersIntersect,
  IconCircleCheck,
  IconMapPin,
  IconFileText,
  IconEye,
} from "@tabler/icons-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { OcrSubmission, OcrExtractedData } from "@/types/digitizer";

interface DisruptionAlertItem {
  id: string;
  title: string;
  title_bn?: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "pending" | "approved" | "rejected";
  lifecycle_stage: "active" | "disputed" | "resolved" | "expired";
  affected_modes: string[];
  affected_segment_ids?: string[];
  delay_minutes: number;
  is_closed: boolean;
  reported_by_type: string;
  observed_at: string;
  expires_at: string;
}

interface ServiceItem {
  id: string;
  name: string;
  mode: string;
  route_code?: string;
  operator?: string;
  description?: string;
  is_active: boolean;
  verification_status: string;
  stopCount?: number;
}

interface FareRuleItem {
  id: string;
  mode: string;
  service_id: string | null;
  serviceName?: string;
  fare_regular: number;
  fare_min: number;
  fare_max: number;
  student_eligible: boolean;
  student_discount_pct: number;
  student_fare_floor: number;
  source_id: string;
  effective_date: string;
}

const DHAKA_HUBS = [
  { value: "hub_banasree", label: "Banasree (বনশ্রী)" },
  { value: "hub_kawran_bazar", label: "Kawran Bazar (কাওরান বাজার)" },
  { value: "hub_mirpur_10", label: "Mirpur 10 (মিরপুর ১০)" },
  { value: "hub_motijheel", label: "Motijheel (মতিঝিল)" },
  { value: "hub_uttara_north", label: "Uttara North (উত্তরা উত্তর)" },
  { value: "hub_shahbagh", label: "Shahbagh (শাহবাগ)" },
  { value: "hub_farmgate", label: "Farmgate (ফার্মগেট)" },
  { value: "hub_agargaon", label: "Agargaon (আগারগাঁও)" },
  { value: "hub_mohakhali", label: "Mohakhali (মহাখালী)" },
  { value: "hub_badda", label: "Badda (বাড্ডা)" },
  { value: "hub_gulshan_1", label: "Gulshan 1 (গুলশান ১)" },
  { value: "hub_rampura", label: "Rampura (রামপুরা)" },
  { value: "hub_airport", label: "Airport (বিমানবন্দর)" },
  { value: "hub_malibagh", label: "Malibagh (মালিবাগ)" },
];

const SCENARIOS = [
  { value: "none", label: "None (Baseline Clear Transit Conditions)" },
  {
    value: "disrupt_malibagh_waterlogging",
    label: "🌊 Malibagh Waterlogging (Closed for Rickshaws/Cars, +25m delay)",
  },
  {
    value: "disrupt_farmgate_vip_movement",
    label: "🚔 Farmgate VIP Motorcade Protocol (+20m bus hold)",
  },
  {
    value: "disrupt_mrt_shewrapara_delay",
    label: "🚇 MRT Line 6 Signaling Hold (+10m dwell)",
  },
  {
    value: "disrupt_mohakhali_roadwork",
    label: "🚧 Mohakhali Flyover Maintenance (+15m bus delay)",
  },
  {
    value: "disrupt_rampura_blockade",
    label: "🛑 Rampura Canal Feeder Blockade (Complete Impassable)",
  },
  {
    value: "disrupt_shahbagh_protest",
    label: "📢 Shahbagh Student Gathering (Buses Diverted, +30m delay)",
  },
];

export default function AdminPortalPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<string | null>("moderation");

  // Moderation / Disruption Queue State
  const [alerts, setAlerts] = useState<DisruptionAlertItem[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertFilter, setAlertFilter] = useState<string>("all");
  const [alertSearch, setAlertSearch] = useState<string>("");
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  // Create Alert Modal State
  const [
    createAlertOpened,
    { open: openCreateAlert, close: closeCreateAlert },
  ] = useDisclosure(false);
  const [newAlertTitle, setNewAlertTitle] = useState("");
  const [newAlertTitleBn, setNewAlertTitleBn] = useState("");
  const [newAlertSeverity, setNewAlertSeverity] = useState<string>("medium");
  const [newAlertModes, setNewAlertModes] = useState<string[]>(["bus"]);
  const [newAlertDelay, setNewAlertDelay] = useState<number>(15);
  const [newAlertIsClosed, setNewAlertIsClosed] = useState<boolean>(false);
  const [newAlertDesc, setNewAlertDesc] = useState("");
  const [dispatchingAlert, setDispatchingAlert] = useState(false);

  // Transit Services CMS State
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [cmsSearch, setCmsSearch] = useState("");

  // Create Service Modal State
  const [
    createServiceOpened,
    { open: openCreateService, close: closeCreateService },
  ] = useDisclosure(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceMode, setNewServiceMode] = useState<string>("bus");
  const [newServiceCode, setNewServiceCode] = useState("");
  const [newServiceOp, setNewServiceOp] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [savingService, setSavingService] = useState(false);

  // Statutory Fare Rules State
  const [fareRules, setFareRules] = useState<FareRuleItem[]>([]);
  const [faresLoading, setFaresLoading] = useState(false);
  const [editFareOpened, { open: openEditFare, close: closeEditFare }] =
    useDisclosure(false);
  const [selectedFareRule, setSelectedFareRule] = useState<FareRuleItem | null>(
    null,
  );
  const [editingRegularFare, setEditingRegularFare] = useState<number>(20);
  const [editingMinFare, setEditingMinFare] = useState<number>(10);
  const [editingMaxFare, setEditingMaxFare] = useState<number>(50);
  const [editingStudentEligible, setEditingStudentEligible] =
    useState<boolean>(true);
  const [editingStudentPct, setEditingStudentPct] = useState<number>(50);
  const [editingStudentFloor, setEditingStudentFloor] = useState<number>(10);
  const [savingFare, setSavingFare] = useState(false);

  // OCR Submissions Queue & Review State
  const [ocrSubmissions, setOcrSubmissions] = useState<OcrSubmission[]>([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrFilter, setOcrFilter] = useState<string>("all");
  const [ocrViewMode, setOcrViewMode] = useState<string>("queue"); // "queue" | "scanner"
  const [ocrReviewOpened, { open: openOcrReview, close: closeOcrReview }] =
    useDisclosure(false);
  const [selectedOcrSub, setSelectedOcrSub] = useState<OcrSubmission | null>(
    null,
  );
  const [adminOcrName, setAdminOcrName] = useState("");
  const [adminOcrMode, setAdminOcrMode] = useState<string>("bus");
  const [adminOcrOperator, setAdminOcrOperator] = useState("");
  const [adminOcrOrigin, setAdminOcrOrigin] = useState("");
  const [adminOcrDestination, setAdminOcrDestination] = useState("");
  const [adminOcrVia, setAdminOcrVia] = useState("");
  const [adminOcrFareReg, setAdminOcrFareReg] = useState<number | "">("");
  const [adminOcrFareStudent, setAdminOcrFareStudent] = useState<number | "">(
    "",
  );
  const [adminOcrLandmark, setAdminOcrLandmark] = useState("");
  const [adminReviewNotes, setAdminReviewNotes] = useState("");
  const [processingOcr, setProcessingOcr] = useState(false);

  // Admin Direct Scanner State
  const [scannerFile, setScannerFile] = useState<File | null>(null);
  const [scannerPreview, setScannerPreview] = useState<string | null>(null);
  const [scannerSample, setScannerSample] = useState<string>("sample_bikolpo");
  const [scannerRunning, setScannerRunning] = useState(false);
  const [scannerResult, setScannerResult] = useState<any | null>(null);

  // Disruption Simulator (Phase 6) State
  const [simOrigin, setSimOrigin] = useState<string>("hub_banasree");
  const [simDestination, setSimDestination] =
    useState<string>("hub_kawran_bazar");
  const [simScenario, setSimScenario] = useState<string>(
    "disrupt_malibagh_waterlogging",
  );
  const [simStudent, setSimStudent] = useState<boolean>(false);
  const [simLoading, setSimLoading] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<{
    baseline: any;
    disrupted: any;
    durationDelta: number;
    fareDelta: number;
    transfersDelta: number;
    impassableAvoided: boolean;
  } | null>(null);

  // AI Key Pool State
  const [aiPoolData, setAiPoolData] = useState<any>(null);
  const [aiPoolLoading, setAiPoolLoading] = useState(false);

  // Verify Admin Session on mount - Strict Protection
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (
          !res.ok ||
          !data.authenticated ||
          !data.user ||
          (data.user.role !== "admin" &&
            data.user.role !== "super_admin" &&
            data.user.role !== "moderator")
        ) {
          router.push("/login?redirect=/admin&error=auth_required");
          return;
        }
        setAdminUser(data.user);
      } catch {
        router.push("/login?redirect=/admin&error=auth_required");
      } finally {
        setAuthLoading(false);
      }
    };

    verifySession();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      notifications.show({
        title: "Signed Out",
        message: "Admin session terminated successfully.",
        color: "dark",
      });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  // 1. Fetch Moderation Alerts
  const fetchAlerts = async () => {
    setAlertsLoading(true);
    try {
      const res = await fetch(`/api/alerts?forAdmin=true&_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      if (data.alerts) {
        setAlerts(data.alerts);
      }
    } catch {
      //
    } finally {
      setAlertsLoading(false);
    }
  };

  // 2. Fetch Transit CMS Services
  const fetchServices = async () => {
    setServicesLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      if (data.success) {
        setServices(data.services || []);
      }
    } catch {
      //
    } finally {
      setServicesLoading(false);
    }
  };

  // 3. Fetch Statutory Fare Rules
  const fetchFareRules = async () => {
    setFaresLoading(true);
    try {
      const res = await fetch("/api/admin/fares");
      const data = await res.json();
      if (data.success) {
        setFareRules(data.fareRules || []);
      }
    } catch {
      //
    } finally {
      setFaresLoading(false);
    }
  };

  // 4. Fetch OCR Submissions
  const fetchOcrSubmissions = async () => {
    setOcrLoading(true);
    try {
      const res = await fetch("/api/ocr/submissions");
      const data = await res.json();
      if (data.success) {
        setOcrSubmissions(data.submissions || []);
      }
    } catch {
      //
    } finally {
      setOcrLoading(false);
    }
  };

  // 5. Fetch AI Pool
  const fetchAiPool = async () => {
    setAiPoolLoading(true);
    try {
      const res = await fetch("/api/admin/ai-pool");
      const data = await res.json();
      if (data.success) {
        setAiPoolData(data);
      }
    } catch {
      //
    } finally {
      setAiPoolLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchServices();
    fetchFareRules();
    fetchOcrSubmissions();
    fetchAiPool();
  }, []);

  // Handle Moderation Action (Optimistic & Resilient)
  const handleModeration = async (
    alertId: string,
    action: "approve" | "reject" | "resolve",
  ) => {
    const status =
      action === "approve"
        ? "approved"
        : action === "reject"
          ? "rejected"
          : "approved";
    const lifecycleStage = action === "resolve" ? "resolved" : "active";

    // 1. Optimistic Local State Update (0ms immediate responsiveness)
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? { ...a, status, lifecycle_stage: lifecycleStage }
          : a,
      ),
    );
    setModeratingId(alertId);

    try {
      const res = await fetch(`/api/reports/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, lifecycleStage }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        notifications.show({
          title: "Moderation Recorded",
          message: `Alert updated to ${status} (${lifecycleStage}).`,
          color:
            action === "approve"
              ? "green"
              : action === "reject"
                ? "red"
                : "teal",
        });

        // Reconcile server response
        if (data.alert) {
          setAlerts((prev) =>
            prev.map((a) => (a.id === alertId ? data.alert : a)),
          );
        }
      } else {
        notifications.show({
          title: "Moderation Failed",
          message: data.error || "Failed to record moderation action.",
          color: "red",
        });
        fetchAlerts();
      }
    } catch {
      notifications.show({
        title: "Network Error",
        message: "Failed to connect to moderation service.",
        color: "red",
      });
      fetchAlerts();
    } finally {
      setModeratingId(null);
    }
  };

  // Handle Delete Alert (Optimistic & Resilient)
  const handleDeleteAlert = async (alertId: string) => {
    // 1. Optimistic removal immediately
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));

    try {
      const res = await fetch(`/api/reports/${alertId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        notifications.show({
          title: "Alert Purged",
          message: `Incident ${alertId} was removed from the system.`,
          color: "dark",
        });
      } else {
        notifications.show({
          title: "Error Purging Alert",
          message: data.error || "Failed to remove alert.",
          color: "red",
        });
        fetchAlerts();
      }
    } catch {
      notifications.show({
        title: "Network Error",
        message: "Failed to connect to purge endpoint.",
        color: "red",
      });
      fetchAlerts();
    }
  };

  // Handle Dispatch Admin Alert
  const handleDispatchAdminAlert = async () => {
    if (!newAlertTitle.trim()) {
      notifications.show({
        title: "Missing Information",
        message: "Please provide an incident title.",
        color: "red",
      });
      return;
    }

    setDispatchingAlert(true);
    try {
      const res = await fetch("/api/admin/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newAlertTitle,
          title_bn: newAlertTitleBn || newAlertTitle,
          description: newAlertDesc,
          severity: newAlertSeverity,
          affected_modes: newAlertModes,
          delay_minutes: newAlertDelay,
          is_closed: newAlertIsClosed,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.alert) {
        // Optimistically insert alert at top
        setAlerts((prev) => [data.alert, ...prev]);
        notifications.show({
          title: "Official Alert Published",
          message: `${newAlertTitle} has been broadcast to all commuters.`,
          color: "green",
        });
        closeCreateAlert();
        setNewAlertTitle("");
        setNewAlertTitleBn("");
        setNewAlertDesc("");
        fetchAlerts();
      } else {
        notifications.show({
          title: "Dispatch Failed",
          message: data.error || "Failed to broadcast official alert.",
          color: "red",
        });
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Server error occurred while dispatching alert.",
        color: "red",
      });
    } finally {
      setDispatchingAlert(false);
    }
  };

  // Handle Toggle Service Status (Active / Suspended)
  const handleToggleServiceStatus = async (
    serviceId: string,
    currentActive: boolean,
  ) => {
    const nextActive = !currentActive;
    try {
      const res = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, isActive: nextActive }),
      });

      if (res.ok) {
        notifications.show({
          title: "Transit CMS Updated",
          message: `Service operational status changed to ${nextActive ? "Active" : "Suspended"}.`,
          color: "dark",
        });
        setServices((prev) =>
          prev.map((s) =>
            s.id === serviceId ? { ...s, is_active: nextActive } : s,
          ),
        );
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to update service status.",
        color: "red",
      });
    }
  };

  // Handle Create Service
  const handleCreateService = async () => {
    if (!newServiceName.trim()) {
      notifications.show({
        title: "Required Field",
        message: "Please enter a service name.",
        color: "red",
      });
      return;
    }

    setSavingService(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newServiceName,
          mode: newServiceMode,
          route_code: newServiceCode,
          operator: newServiceOp,
          description: newServiceDesc,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notifications.show({
          title: "Service Registered",
          message: `${data.service.name} has been saved to the Transit CMS.`,
          color: "green",
        });
        closeCreateService();
        setNewServiceName("");
        setNewServiceCode("");
        setNewServiceOp("");
        setNewServiceDesc("");
        fetchServices();
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to save transit service.",
        color: "red",
      });
    } finally {
      setSavingService(false);
    }
  };

  // Handle Edit Fare Rule
  const handleOpenEditFare = (rule: FareRuleItem) => {
    setSelectedFareRule(rule);
    setEditingRegularFare(rule.fare_regular);
    setEditingMinFare(rule.fare_min);
    setEditingMaxFare(rule.fare_max);
    setEditingStudentEligible(rule.student_eligible);
    setEditingStudentPct(rule.student_discount_pct);
    setEditingStudentFloor(rule.student_fare_floor);
    openEditFare();
  };

  const handleSaveFareRule = async () => {
    if (!selectedFareRule) return;
    setSavingFare(true);
    try {
      const res = await fetch("/api/admin/fares", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedFareRule.id,
          fare_regular: editingRegularFare,
          fare_min: editingMinFare,
          fare_max: editingMaxFare,
          student_eligible: editingStudentEligible,
          student_discount_pct: editingStudentPct,
          student_fare_floor: editingStudentFloor,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notifications.show({
          title: "Fare Policy Updated",
          message:
            "Statutory tariff rates synchronized with calculation engine.",
          color: "green",
        });
        closeEditFare();
        fetchFareRules();
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to update fare policy.",
        color: "red",
      });
    } finally {
      setSavingFare(false);
    }
  };

  // Open OCR Review Inspection Modal
  const handleOpenOcrReview = (sub: OcrSubmission) => {
    setSelectedOcrSub(sub);
    setAdminOcrName(sub.extractedData.serviceName || "");
    setAdminOcrMode(sub.extractedData.mode || "bus");
    setAdminOcrOperator(sub.extractedData.operator || "");
    setAdminOcrOrigin(sub.extractedData.origin || "");
    setAdminOcrDestination(sub.extractedData.destination || "");
    setAdminOcrVia(sub.extractedData.viaStoppages?.join(", ") || "");
    setAdminOcrFareReg(
      sub.extractedData.fareRegular !== null
        ? sub.extractedData.fareRegular
        : "",
    );
    setAdminOcrFareStudent(
      sub.extractedData.fareStudent !== null
        ? sub.extractedData.fareStudent
        : "",
    );
    setAdminOcrLandmark(sub.extractedData.boardingLandmark || "");
    setAdminReviewNotes(sub.adminNotes || "");
    openOcrReview();
  };

  // Handle OCR Approval & Publish
  const handleApproveOcrSubmission = async (publishToCms: boolean = true) => {
    if (!selectedOcrSub) return;
    setProcessingOcr(true);

    try {
      const res = await fetch(`/api/ocr/submissions/${selectedOcrSub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          adminNotes: adminReviewNotes,
          publishToCms,
          editedData: {
            serviceName: adminOcrName,
            mode: adminOcrMode,
            operator: adminOcrOperator,
            origin: adminOcrOrigin,
            destination: adminOcrDestination,
            viaStoppages: adminOcrVia
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            fareRegular:
              adminOcrFareReg !== "" ? Number(adminOcrFareReg) : null,
            fareStudent:
              adminOcrFareStudent !== "" ? Number(adminOcrFareStudent) : null,
            boardingLandmark: adminOcrLandmark,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notifications.show({
          title: "Signboard Approved & Published",
          message: `${adminOcrName} verified and merged into Transit CMS.`,
          color: "green",
        });
        closeOcrReview();
        fetchOcrSubmissions();
        fetchServices();
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to approve OCR submission.",
        color: "red",
      });
    } finally {
      setProcessingOcr(false);
    }
  };

  // Handle OCR Rejection
  const handleRejectOcrSubmission = async () => {
    if (!selectedOcrSub) return;
    setProcessingOcr(true);

    try {
      const res = await fetch(`/api/ocr/submissions/${selectedOcrSub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          adminNotes:
            adminReviewNotes || "Unverifiable or unclear signboard photo.",
          publishToCms: false,
        }),
      });

      if (res.ok) {
        notifications.show({
          title: "Submission Rejected",
          message: `Submission ${selectedOcrSub.receiptCode} marked as rejected.`,
          color: "dark",
        });
        closeOcrReview();
        fetchOcrSubmissions();
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to reject OCR submission.",
        color: "red",
      });
    } finally {
      setProcessingOcr(false);
    }
  };

  // Handle Delete OCR Submission
  const handleDeleteOcrSubmission = async (subId: string) => {
    try {
      const res = await fetch(`/api/ocr/submissions/${subId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        notifications.show({
          title: "Submission Deleted",
          message: "OCR notice purged from system.",
          color: "dark",
        });
        setOcrSubmissions((prev) => prev.filter((s) => s.id !== subId));
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to delete submission.",
        color: "red",
      });
    }
  };

  // Admin Direct Scanner Execution
  const handleAdminScannerRun = async () => {
    setScannerRunning(true);
    try {
      let imageBase64: string | null = null;
      let mimeType = "image/jpeg";

      if (scannerFile) {
        mimeType = scannerFile.type || "image/jpeg";
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(scannerFile);
        });
      }

      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          sampleKey: scannerFile ? undefined : scannerSample,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setScannerResult(data);
        notifications.show({
          title: "Notice Digitized",
          message: `Identified ${data.extractedData.serviceName || "transit entity"}.`,
          color: "dark",
        });
      }
    } catch {
      notifications.show({
        title: "Scan Error",
        message: "Failed to parse notice image.",
        color: "red",
      });
    } finally {
      setScannerRunning(false);
    }
  };

  // Handle Direct Merge from Admin Scanner
  const handleDirectMergeScanner = async () => {
    if (!scannerResult?.extractedData) return;
    const d = scannerResult.extractedData;
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: d.serviceName || "New Digitized Line",
          mode: d.mode || "bus",
          operator: d.operator || "Transit Operator",
          route_code: `${(d.mode || "bus").toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          description: `Directly digitized notice. Origin: ${d.origin}, Destination: ${d.destination}. Stoppages: ${d.viaStoppages?.join(", ")}.`,
        }),
      });

      if (res.ok) {
        notifications.show({
          title: "Merged into CMS",
          message: `${d.serviceName} is now active in transit database.`,
          color: "green",
        });
        setScannerResult(null);
        setScannerFile(null);
        setScannerPreview(null);
        fetchServices();
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to merge service into CMS.",
        color: "red",
      });
    }
  };

  // Handle What-If Disruption Simulation (Phase 6)
  const handleRunSimulation = async () => {
    setSimLoading(true);
    try {
      const baseRes = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originHubId: simOrigin,
          destinationHubId: simDestination,
          student: simStudent,
          scenarioId: null,
        }),
      });
      const baselineData = await baseRes.json();

      const disRes = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originHubId: simOrigin,
          destinationHubId: simDestination,
          student: simStudent,
          scenarioId: simScenario === "none" ? null : simScenario,
        }),
      });
      const disruptedData = await disRes.json();

      const bRoute = baselineData.routes?.[0];
      const dRoute = disruptedData.routes?.[0];

      if (!bRoute) {
        notifications.show({
          title: "Simulation Alert",
          message: "No baseline path found between chosen hubs.",
          color: "yellow",
        });
        setSimResult(null);
        return;
      }

      const durDelta = dRoute
        ? dRoute.totalDurationMin - bRoute.totalDurationMin
        : 999;
      const fareDelta = dRoute
        ? (simStudent ? dRoute.fareStudentBdt : dRoute.fareRegularBdt) -
          (simStudent ? bRoute.fareStudentBdt : bRoute.fareRegularBdt)
        : 0;
      const transDelta = dRoute ? dRoute.transfers - bRoute.transfers : 0;
      const impassableAvoided =
        !disruptedData.success ||
        dRoute?.warnings?.some(
          (w: string) =>
            w.includes("Disruption bypass") || w.includes("detour"),
        );

      setSimResult({
        baseline: baselineData,
        disrupted: disruptedData,
        durationDelta: durDelta,
        fareDelta,
        transfersDelta: transDelta,
        impassableAvoided,
      });

      notifications.show({
        title: "Operational Simulation Complete",
        message: `Analysis calculated: Duration delta ${durDelta >= 0 ? "+" : ""}${durDelta} min.`,
        color: "dark",
      });
    } catch {
      notifications.show({
        title: "Simulation Failed",
        message:
          "Network routing engine failed to compute comparative scenarios.",
        color: "red",
      });
    } finally {
      setSimLoading(false);
    }
  };

  // Filtered Alerts
  const filteredAlerts = alerts.filter((alert) => {
    if (alertFilter === "pending" && alert.status !== "pending") return false;
    if (
      alertFilter === "approved" &&
      (alert.status !== "approved" || alert.lifecycle_stage !== "active")
    )
      return false;
    if (alertFilter === "resolved" && alert.lifecycle_stage !== "resolved")
      return false;
    if (alertFilter === "rejected" && alert.status !== "rejected") return false;

    if (alertSearch.trim()) {
      const q = alertSearch.toLowerCase();
      const matchTitle = alert.title?.toLowerCase().includes(q);
      const matchBn = alert.title_bn?.toLowerCase().includes(q);
      const matchDesc = alert.description?.toLowerCase().includes(q);
      const matchModes = alert.affected_modes?.some((m) =>
        m.toLowerCase().includes(q),
      );
      if (!matchTitle && !matchBn && !matchDesc && !matchModes) return false;
    }

    return true;
  });

  // Filtered Services
  const filteredServices = services.filter((s) => {
    if (!cmsSearch.trim()) return true;
    const q = cmsSearch.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.mode?.toLowerCase().includes(q) ||
      s.operator?.toLowerCase().includes(q) ||
      s.route_code?.toLowerCase().includes(q)
    );
  });

  // Filtered OCR Submissions
  const filteredOcrSubmissions = ocrSubmissions.filter((sub) => {
    if (ocrFilter === "pending" && sub.status !== "pending") return false;
    if (ocrFilter === "approved" && sub.status !== "approved") return false;
    if (ocrFilter === "rejected" && sub.status !== "rejected") return false;
    return true;
  });

  // Counts
  const pendingCount = alerts.filter((a) => a.status === "pending").length;
  const approvedCount = alerts.filter(
    (a) => a.status === "approved" && a.lifecycle_stage === "active",
  ).length;
  const resolvedCount = alerts.filter(
    (a) => a.lifecycle_stage === "resolved",
  ).length;
  const rejectedCount = alerts.filter((a) => a.status === "rejected").length;
  const pendingOcrCount = ocrSubmissions.filter(
    (s) => s.status === "pending",
  ).length;

  if (authLoading) {
    return (
      <Container size="sm" py={120} style={{ textAlign: "center" }}>
        <Loader color="dark" size="lg" />
        <Text size="sm" style={{ color: "var(--text-muted)", marginTop: 16 }}>
          Verifying administrative credentials...
        </Text>
      </Container>
    );
  }

  return (
    <Box style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      <Container size="lg" py="xl">
        <Stack gap="lg">
          {/* Header - Uber Clean Aesthetic */}
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
              <Group gap="sm" align="center">
                <Link href="/" style={{ textDecoration: "none" }}>
                  <Button
                    size="xs"
                    radius="xl"
                    variant="default"
                    leftSection={<IconArrowLeft size={15} />}
                    styles={{
                      root: {
                        background: "var(--bg-card-inner)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-main)",
                        fontWeight: 600,
                      },
                    }}
                  >
                    Commuter App
                  </Button>
                </Link>

                <Box
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--text-main)",
                    color: "var(--bg-page)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconShieldLock size={18} stroke={2.2} />
                </Box>

                <Box>
                  <Title
                    order={3}
                    style={{
                      color: "var(--text-main)",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    DhakaPath Transit Administration & Moderation
                  </Title>
                  <Text size="11px" style={{ color: "var(--text-muted)" }}>
                    Protected Multi-Modal Operations Portal
                  </Text>
                </Box>
              </Group>

              <Group gap="xs" align="center">
                <Badge
                  size="sm"
                  radius="xl"
                  variant="outline"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-main)",
                    background: "var(--bg-card-inner)",
                    fontWeight: 600,
                  }}
                >
                  ● {adminUser?.email || "admin@dhakapath.gov.bd"}
                </Badge>

                <Badge
                  size="sm"
                  radius="xl"
                  variant="filled"
                  style={{
                    background: "var(--text-main)",
                    color: "var(--bg-page)",
                    fontWeight: 700,
                  }}
                >
                  SUPER ADMIN
                </Badge>

                <ThemeToggle />

                <Tooltip label="End Session">
                  <ActionIcon
                    variant="default"
                    size="md"
                    radius="xl"
                    onClick={handleSignOut}
                    styles={{
                      root: {
                        background: "var(--bg-card-inner)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-main)",
                      },
                    }}
                  >
                    <IconLogout size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Paper>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            styles={{
              list: { borderColor: "var(--border-subtle)" },
              tab: {
                fontWeight: 600,
                fontSize: "13px",
                color: "var(--text-muted)",
                "&[data-active]": {
                  color: "var(--text-main)",
                  borderColor: "var(--text-main)",
                },
              },
            }}
          >
            <Tabs.List>
              <Tabs.Tab
                value="moderation"
                leftSection={<IconShieldLock size={16} />}
              >
                Disruption Queue (
                {pendingCount > 0 ? `${pendingCount} Pending` : alerts.length})
              </Tabs.Tab>
              <Tabs.Tab value="cms" leftSection={<IconBus size={16} />}>
                Transit Services CMS ({services.length})
              </Tabs.Tab>
              <Tabs.Tab value="fares" leftSection={<IconCoins size={16} />}>
                Statutory Fare Schedule ({fareRules.length})
              </Tabs.Tab>
              <Tabs.Tab value="digitizer" leftSection={<IconScan size={16} />}>
                OCR Reviews & Digitizer (
                {pendingOcrCount > 0
                  ? `${pendingOcrCount} Pending`
                  : ocrSubmissions.length}
                )
              </Tabs.Tab>
              <Tabs.Tab
                value="simulation"
                leftSection={<IconLayersIntersect size={16} />}
              >
                Operations Simulator (What-If)
              </Tabs.Tab>
              <Tabs.Tab value="ai_keys" leftSection={<IconKey size={16} />}>
                AI Key Failover Pool
              </Tabs.Tab>
            </Tabs.List>

            {/* TAB 1: Disruption Moderation Queue */}
            <Tabs.Panel value="moderation" pt="md">
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
                        Incident Reports Moderation Queue
                      </Title>
                      <Text size="xs" style={{ color: "var(--text-muted)" }}>
                        Admin review controls whether user-submitted disruptions
                        affect live routing calculations.
                      </Text>
                    </Box>

                    <Group gap="xs">
                      <Button
                        size="xs"
                        radius="xl"
                        variant="default"
                        leftSection={<IconRefresh size={14} />}
                        onClick={fetchAlerts}
                        loading={alertsLoading}
                        styles={{
                          root: {
                            background: "var(--bg-card-inner)",
                            borderColor: "var(--border-subtle)",
                            color: "var(--text-main)",
                            fontWeight: 600,
                          },
                        }}
                      >
                        Refresh Queue
                      </Button>

                      <Button
                        size="xs"
                        radius="xl"
                        leftSection={<IconPlus size={14} />}
                        onClick={openCreateAlert}
                        styles={{
                          root: {
                            background: "var(--text-main)",
                            color: "var(--bg-page)",
                            fontWeight: 600,
                          },
                        }}
                      >
                        Dispatch Incident Alert
                      </Button>
                    </Group>
                  </Group>

                  {/* Filters & Search */}
                  <Group justify="space-between" wrap="wrap" gap="sm">
                    <SegmentedControl
                      size="xs"
                      radius="xl"
                      value={alertFilter}
                      onChange={setAlertFilter}
                      data={[
                        { label: `All (${alerts.length})`, value: "all" },
                        {
                          label: `Pending (${pendingCount})`,
                          value: "pending",
                        },
                        {
                          label: `Active (${approvedCount})`,
                          value: "approved",
                        },
                        {
                          label: `Resolved (${resolvedCount})`,
                          value: "resolved",
                        },
                        {
                          label: `Rejected (${rejectedCount})`,
                          value: "rejected",
                        },
                      ]}
                      styles={{
                        root: {
                          background: "var(--bg-card-inner)",
                          border: "1px solid var(--border-subtle)",
                        },
                        label: { fontWeight: 600 },
                      }}
                    />

                    <TextInput
                      size="xs"
                      radius="xl"
                      placeholder="Search alerts by title or mode..."
                      leftSection={<IconSearch size={14} />}
                      value={alertSearch}
                      onChange={(e) => setAlertSearch(e.currentTarget.value)}
                      style={{ minWidth: 260 }}
                      styles={{
                        input: {
                          background: "var(--bg-card-inner)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-main)",
                        },
                      }}
                    />
                  </Group>

                  {/* Alerts Table */}
                  <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Incident
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Severity
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Modes
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Delay / Closed
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Status
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Lifecycle
                        </Table.Th>
                        <Table.Th
                          style={{
                            color: "var(--text-main)",
                            textAlign: "right",
                          }}
                        >
                          Actions
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredAlerts.length === 0 ? (
                        <Table.Tr>
                          <Table.Td
                            colSpan={7}
                            style={{ textAlign: "center", padding: "32px" }}
                          >
                            <Text
                              size="sm"
                              style={{ color: "var(--text-muted)" }}
                            >
                              No incident alerts matching this filter.
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ) : (
                        filteredAlerts.map((alert) => (
                          <Table.Tr key={alert.id}>
                            <Table.Td>
                              <Text
                                fw={700}
                                size="sm"
                                style={{ color: "var(--text-main)" }}
                              >
                                {alert.title}
                              </Text>
                              {alert.title_bn && (
                                <Text
                                  size="11px"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  {alert.title_bn}
                                </Text>
                              )}
                              <Text
                                size="xs"
                                style={{
                                  color: "var(--text-muted)",
                                  maxWidth: 300,
                                }}
                                lineClamp={2}
                              >
                                {alert.description ||
                                  "No additional details provided."}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                size="xs"
                                radius="sm"
                                variant="filled"
                                style={{
                                  background:
                                    alert.severity === "critical"
                                      ? "#e11900"
                                      : alert.severity === "high"
                                        ? "#ff9900"
                                        : "var(--text-main)",
                                  color: "var(--bg-page)",
                                  fontWeight: 700,
                                }}
                              >
                                {alert.severity}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Group gap={4}>
                                {alert.affected_modes?.map((m: string) => (
                                  <Badge
                                    key={m}
                                    size="xs"
                                    radius="sm"
                                    variant="outline"
                                    style={{
                                      borderColor: "var(--border-subtle)",
                                      color: "var(--text-main)",
                                      background: "var(--bg-card-inner)",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {m}
                                  </Badge>
                                ))}
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Text
                                size="xs"
                                fw={600}
                                style={{ color: "var(--text-main)" }}
                              >
                                +{alert.delay_minutes || 0} min
                              </Text>
                              {alert.is_closed && (
                                <Badge
                                  size="xs"
                                  color="red"
                                  variant="light"
                                  mt={2}
                                >
                                  Road Blocked
                                </Badge>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                size="xs"
                                radius="sm"
                                variant="filled"
                                style={{
                                  background:
                                    alert.status === "approved"
                                      ? "var(--text-main)"
                                      : alert.status === "rejected"
                                        ? "#e11900"
                                        : "var(--bg-card-inner)",
                                  color:
                                    alert.status === "pending"
                                      ? "var(--text-main)"
                                      : "var(--bg-page)",
                                  fontWeight: 700,
                                }}
                              >
                                {alert.status}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                size="xs"
                                radius="sm"
                                variant="outline"
                                style={{
                                  borderColor: "var(--border-subtle)",
                                  color:
                                    alert.lifecycle_stage === "resolved"
                                      ? "#00aa66"
                                      : "var(--text-muted)",
                                  fontWeight: 600,
                                }}
                              >
                                {alert.lifecycle_stage}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Group gap={6} justify="flex-end">
                                <Tooltip label="Approve & Apply to Routes">
                                  <ActionIcon
                                    size="sm"
                                    radius="xl"
                                    variant="filled"
                                    loading={moderatingId === alert.id}
                                    onClick={() =>
                                      handleModeration(alert.id, "approve")
                                    }
                                    styles={{
                                      root: {
                                        background: "var(--text-main)",
                                        color: "var(--bg-page)",
                                      },
                                    }}
                                  >
                                    <IconCheck size={14} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Reject as Spam">
                                  <ActionIcon
                                    size="sm"
                                    radius="xl"
                                    variant="default"
                                    loading={moderatingId === alert.id}
                                    onClick={() =>
                                      handleModeration(alert.id, "reject")
                                    }
                                    styles={{
                                      root: {
                                        borderColor: "var(--border-subtle)",
                                        color: "#e11900",
                                      },
                                    }}
                                  >
                                    <IconX size={14} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Mark as Resolved">
                                  <ActionIcon
                                    size="sm"
                                    radius="xl"
                                    variant="default"
                                    loading={moderatingId === alert.id}
                                    onClick={() =>
                                      handleModeration(alert.id, "resolve")
                                    }
                                    styles={{
                                      root: {
                                        borderColor: "var(--border-subtle)",
                                        color: "#00aa66",
                                      },
                                    }}
                                  >
                                    <IconCircleCheck size={14} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Delete Incident">
                                  <ActionIcon
                                    size="sm"
                                    radius="xl"
                                    variant="subtle"
                                    color="red"
                                    onClick={() => handleDeleteAlert(alert.id)}
                                  >
                                    <IconTrash size={14} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))
                      )}
                    </Table.Tbody>
                  </Table>
                </Stack>
              </Paper>
            </Tabs.Panel>

            {/* TAB 2: Transit Services CMS */}
            <Tabs.Panel value="cms" pt="md">
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
                        Pilot Transit Services Catalog & Operational State
                      </Title>
                      <Text size="xs" style={{ color: "var(--text-muted)" }}>
                        Directly toggle line operational availability or
                        register newly verified lines into routing topology.
                      </Text>
                    </Box>

                    <Group gap="xs">
                      <Button
                        size="xs"
                        radius="xl"
                        variant="default"
                        leftSection={<IconRefresh size={14} />}
                        onClick={fetchServices}
                        loading={servicesLoading}
                        styles={{
                          root: {
                            background: "var(--bg-card-inner)",
                            borderColor: "var(--border-subtle)",
                            color: "var(--text-main)",
                            fontWeight: 600,
                          },
                        }}
                      >
                        Refresh Services
                      </Button>

                      <Button
                        size="xs"
                        radius="xl"
                        leftSection={<IconPlus size={14} />}
                        onClick={openCreateService}
                        styles={{
                          root: {
                            background: "var(--text-main)",
                            color: "var(--bg-page)",
                            fontWeight: 600,
                          },
                        }}
                      >
                        Register New Service
                      </Button>
                    </Group>
                  </Group>

                  {/* Search Bar */}
                  <TextInput
                    size="xs"
                    radius="xl"
                    placeholder="Search transit service by name, operator, or code..."
                    leftSection={<IconSearch size={14} />}
                    value={cmsSearch}
                    onChange={(e) => setCmsSearch(e.currentTarget.value)}
                    styles={{
                      input: {
                        background: "var(--bg-card-inner)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-main)",
                      },
                    }}
                  />

                  {/* Services Table with Operational Toggle */}
                  <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Service Name
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Route Code
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Mode
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Operator
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Stops
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Operational Status
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Verification
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredServices.length === 0 ? (
                        <Table.Tr>
                          <Table.Td
                            colSpan={7}
                            style={{ textAlign: "center", padding: "32px" }}
                          >
                            <Text
                              size="sm"
                              style={{ color: "var(--text-muted)" }}
                            >
                              No transit services found.
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ) : (
                        filteredServices.map((s) => (
                          <Table.Tr key={s.id}>
                            <Table.Td
                              fw={700}
                              style={{ color: "var(--text-main)" }}
                            >
                              {s.name}
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                size="xs"
                                radius="sm"
                                variant="outline"
                                style={{
                                  borderColor: "var(--border-subtle)",
                                  color: "var(--text-main)",
                                  background: "var(--bg-card-inner)",
                                  fontWeight: 600,
                                }}
                              >
                                {s.route_code || "N/A"}
                              </Badge>
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
                                {s.mode.toUpperCase()}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text
                                size="xs"
                                style={{ color: "var(--text-main)" }}
                              >
                                {s.operator || "Standard Syndicate"}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text
                                size="xs"
                                fw={600}
                                style={{ color: "var(--text-muted)" }}
                              >
                                {s.stopCount || 6} stations
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <Switch
                                  size="xs"
                                  color="dark"
                                  checked={s.is_active}
                                  onChange={() =>
                                    handleToggleServiceStatus(s.id, s.is_active)
                                  }
                                />
                                <Badge
                                  size="xs"
                                  radius="sm"
                                  variant="outline"
                                  style={{
                                    borderColor: s.is_active
                                      ? "#00aa66"
                                      : "#e11900",
                                    color: s.is_active ? "#00aa66" : "#e11900",
                                    fontWeight: 700,
                                  }}
                                >
                                  {s.is_active
                                    ? "● Operational"
                                    : "○ Suspended"}
                                </Badge>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Badge size="xs" variant="light" color="blue">
                                {s.verification_status || "verified"}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        ))
                      )}
                    </Table.Tbody>
                  </Table>
                </Stack>
              </Paper>
            </Tabs.Panel>

            {/* TAB 3: Statutory Fare Schedule */}
            <Tabs.Panel value="fares" pt="md">
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
                        Statutory Fare Policy Schedule
                      </Title>
                      <Text size="xs" style={{ color: "var(--text-muted)" }}>
                        Evaluated per continuous vehicle ride (not per segment).
                        Minimum statutory floor for student bus discount is
                        strictly 10 BDT.
                      </Text>
                    </Box>

                    <Button
                      size="xs"
                      radius="xl"
                      variant="default"
                      leftSection={<IconRefresh size={14} />}
                      onClick={fetchFareRules}
                      loading={faresLoading}
                      styles={{
                        root: {
                          background: "var(--bg-card-inner)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-main)",
                          fontWeight: 600,
                        },
                      }}
                    >
                      Refresh Fare Rules
                    </Button>
                  </Group>

                  <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Mode / Service
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Regular Tariff
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Fare Range
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Student Concession
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Floor
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Authority Source
                        </Table.Th>
                        <Table.Th
                          style={{
                            color: "var(--text-main)",
                            textAlign: "right",
                          }}
                        >
                          Actions
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {fareRules.map((f) => (
                        <Table.Tr key={f.id}>
                          <Table.Td
                            fw={700}
                            style={{ color: "var(--text-main)" }}
                          >
                            {f.serviceName || f.mode.toUpperCase()}
                          </Table.Td>
                          <Table.Td>
                            <Text
                              size="sm"
                              fw={700}
                              style={{ color: "var(--text-main)" }}
                            >
                              {f.fare_regular} ৳
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text
                              size="xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {f.fare_min} - {f.fare_max} ৳
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            {f.student_eligible ? (
                              <Badge size="xs" color="green" variant="light">
                                {f.student_discount_pct}% Discount
                              </Badge>
                            ) : (
                              <Badge size="xs" color="gray" variant="outline">
                                Not Applicable
                              </Badge>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              size="xs"
                              radius="sm"
                              variant="outline"
                              style={{
                                borderColor: "var(--border-subtle)",
                                color: "var(--text-main)",
                                fontWeight: 700,
                              }}
                            >
                              {f.student_fare_floor} ৳
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text
                              size="11px"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {f.source_id}
                            </Text>
                          </Table.Td>
                          <Table.Td style={{ textAlign: "right" }}>
                            <Button
                              size="xs"
                              variant="subtle"
                              color="dark"
                              leftSection={<IconEdit size={13} />}
                              onClick={() => handleOpenEditFare(f)}
                            >
                              Edit Tariff
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Stack>
              </Paper>
            </Tabs.Panel>

            {/* TAB 4: OCR Reviews & Signboard Digitizer (Human-in-the-Loop) */}
            <Tabs.Panel value="digitizer" pt="md">
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
                        Signboard Digitizer & Crowdsourced OCR Reviews
                      </Title>
                      <Text size="xs" style={{ color: "var(--text-muted)" }}>
                        Human-in-the-loop validation: Inspect user-submitted
                        signboard photos, cross-reference against route
                        geography, and approve into Transit CMS.
                      </Text>
                    </Box>

                    <SegmentedControl
                      size="xs"
                      radius="xl"
                      value={ocrViewMode}
                      onChange={setOcrViewMode}
                      data={[
                        {
                          label: `Submissions Review Queue (${ocrSubmissions.length})`,
                          value: "queue",
                        },
                        { label: "Direct Street Scanner", value: "scanner" },
                      ]}
                      styles={{
                        root: {
                          background: "var(--bg-card-inner)",
                          border: "1px solid var(--border-subtle)",
                        },
                        label: { fontWeight: 600 },
                      }}
                    />
                  </Group>

                  {/* VIEW 1: Submissions Review Queue */}
                  {ocrViewMode === "queue" && (
                    <Stack gap="sm">
                      <Group justify="space-between" wrap="wrap" gap="sm">
                        <SegmentedControl
                          size="xs"
                          radius="xl"
                          value={ocrFilter}
                          onChange={setOcrFilter}
                          data={[
                            {
                              label: `All (${ocrSubmissions.length})`,
                              value: "all",
                            },
                            {
                              label: `Pending Verification (${pendingOcrCount})`,
                              value: "pending",
                            },
                            {
                              label: "Approved & Published",
                              value: "approved",
                            },
                            { label: "Rejected", value: "rejected" },
                          ]}
                          styles={{
                            root: {
                              background: "var(--bg-card-inner)",
                              border: "1px solid var(--border-subtle)",
                            },
                            label: { fontWeight: 600 },
                          }}
                        />

                        <Button
                          size="xs"
                          radius="xl"
                          variant="default"
                          leftSection={<IconRefresh size={14} />}
                          onClick={fetchOcrSubmissions}
                          loading={ocrLoading}
                        >
                          Refresh Queue
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
                              Observed Fare
                            </Table.Th>
                            <Table.Th style={{ color: "var(--text-main)" }}>
                              DB Match Status
                            </Table.Th>
                            <Table.Th style={{ color: "var(--text-main)" }}>
                              Status
                            </Table.Th>
                            <Table.Th
                              style={{
                                color: "var(--text-main)",
                                textAlign: "right",
                              }}
                            >
                              Actions
                            </Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {filteredOcrSubmissions.length === 0 ? (
                            <Table.Tr>
                              <Table.Td
                                colSpan={8}
                                style={{ textAlign: "center", padding: "32px" }}
                              >
                                <Text
                                  size="sm"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  No signboard submissions matching this filter.
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          ) : (
                            filteredOcrSubmissions.map((sub) => (
                              <Table.Tr key={sub.id}>
                                <Table.Td>
                                  <Badge
                                    size="xs"
                                    variant="outline"
                                    color="dark"
                                  >
                                    {sub.receiptCode}
                                  </Badge>
                                </Table.Td>
                                <Table.Td
                                  fw={700}
                                  style={{ color: "var(--text-main)" }}
                                >
                                  {sub.extractedData.serviceName ||
                                    "Unnamed Notice"}
                                </Table.Td>
                                <Table.Td>
                                  <Badge
                                    size="xs"
                                    variant="filled"
                                    color="dark"
                                  >
                                    {sub.extractedData.mode.toUpperCase()}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>
                                  <Text
                                    size="xs"
                                    style={{ color: "var(--text-main)" }}
                                  >
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
                                  {sub.dbMatch?.originMatchedHub &&
                                  sub.dbMatch?.destinationMatchedHub ? (
                                    <Badge
                                      size="xs"
                                      color="green"
                                      variant="light"
                                    >
                                      Corridor Matched
                                    </Badge>
                                  ) : (
                                    <Badge
                                      size="xs"
                                      color="yellow"
                                      variant="light"
                                    >
                                      New Outer Route
                                    </Badge>
                                  )}
                                </Table.Td>
                                <Table.Td>
                                  <Badge
                                    size="xs"
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
                                      ? "● Approved"
                                      : sub.status === "rejected"
                                        ? "○ Rejected"
                                        : "⏳ Pending"}
                                  </Badge>
                                </Table.Td>
                                <Table.Td style={{ textAlign: "right" }}>
                                  <Group gap={6} justify="flex-end">
                                    <Button
                                      size="xs"
                                      variant="light"
                                      color="dark"
                                      leftSection={<IconEye size={13} />}
                                      onClick={() => handleOpenOcrReview(sub)}
                                    >
                                      Inspect & Verify
                                    </Button>
                                    <ActionIcon
                                      size="sm"
                                      variant="subtle"
                                      color="red"
                                      onClick={() =>
                                        handleDeleteOcrSubmission(sub.id)
                                      }
                                    >
                                      <IconTrash size={14} />
                                    </ActionIcon>
                                  </Group>
                                </Table.Td>
                              </Table.Tr>
                            ))
                          )}
                        </Table.Tbody>
                      </Table>
                    </Stack>
                  )}

                  {/* VIEW 2: Direct Street Scanner */}
                  {ocrViewMode === "scanner" && (
                    <Grid gap="md">
                      <Grid.Col span={{ base: 12, md: 5 }}>
                        <Stack gap="sm">
                          <FileInput
                            label="Upload Street Notice Photo"
                            placeholder="Choose file (.jpg, .png, .webp)"
                            accept="image/*"
                            leftSection={<IconUpload size={16} />}
                            value={scannerFile}
                            onChange={(file) => {
                              setScannerFile(file);
                              setScannerPreview(
                                file ? URL.createObjectURL(file) : null,
                              );
                            }}
                            clearable
                            size="xs"
                          />

                          <Divider
                            label="OR BENCHMARK SAMPLE"
                            labelPosition="center"
                          />

                          <Select
                            label="Benchmark Sample"
                            data={[
                              {
                                value: "sample_bikolpo",
                                label:
                                  "🚏 Bikolpo Paribahan Placard (Mirpur 10)",
                              },
                              {
                                value: "sample_mrt",
                                label:
                                  "🚇 DMTCL Station Concourse Tariff Notice",
                              },
                              {
                                value: "sample_leguna",
                                label: "🚐 Rampura Leguna Stand Notice",
                              },
                              {
                                value: "sample_balaka",
                                label: "🚌 Balaka Special Paribahan Board",
                              },
                            ]}
                            value={scannerSample}
                            onChange={(v) =>
                              setScannerSample(v || "sample_bikolpo")
                            }
                            size="xs"
                          />

                          <Button
                            size="xs"
                            radius="xl"
                            leftSection={
                              scannerRunning ? (
                                <Loader size="xs" color="white" />
                              ) : (
                                <IconSparkles size={14} />
                              )
                            }
                            onClick={handleAdminScannerRun}
                            loading={scannerRunning}
                            styles={{
                              root: {
                                background: "var(--text-main)",
                                color: "var(--bg-page)",
                                fontWeight: 600,
                              },
                            }}
                          >
                            Extract Structured Transit Data
                          </Button>
                        </Stack>
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 7 }}>
                        {scannerResult ? (
                          <Card
                            p="sm"
                            radius="md"
                            style={{ background: "var(--bg-card-inner)" }}
                          >
                            <Stack gap="xs">
                              <Group justify="space-between">
                                <Title
                                  order={5}
                                  style={{
                                    color: "var(--text-main)",
                                    fontWeight: 700,
                                  }}
                                >
                                  Parsed:{" "}
                                  {scannerResult.extractedData?.serviceName}
                                </Title>
                                <Badge size="xs" color="green">
                                  {scannerResult.extractedData?.confidence}
                                </Badge>
                              </Group>
                              <Text
                                size="xs"
                                style={{ color: "var(--text-muted)" }}
                              >
                                📍 {scannerResult.extractedData?.origin} ➔{" "}
                                {scannerResult.extractedData?.destination}
                              </Text>
                              <Text size="xs" fw={700}>
                                Regular Fare:{" "}
                                {scannerResult.extractedData?.fareRegular} ৳ |
                                Student:{" "}
                                {scannerResult.extractedData?.fareStudent} ৳
                              </Text>
                              <Group justify="flex-end" mt="xs">
                                <Button
                                  size="xs"
                                  radius="xl"
                                  onClick={handleDirectMergeScanner}
                                >
                                  Publish Directly into CMS
                                </Button>
                              </Group>
                            </Stack>
                          </Card>
                        ) : (
                          <Box
                            p="xl"
                            style={{
                              border: "1px dashed var(--border-subtle)",
                              borderRadius: 8,
                              textAlign: "center",
                            }}
                          >
                            <IconScan
                              size={28}
                              style={{ opacity: 0.5, marginBottom: 8 }}
                            />
                            <Text
                              size="xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Scan notice photo to view optical entity
                              extraction.
                            </Text>
                          </Box>
                        )}
                      </Grid.Col>
                    </Grid>
                  )}
                </Stack>
              </Paper>
            </Tabs.Panel>

            {/* TAB 5: What-If Disruption Simulator (Phase 6) */}
            <Tabs.Panel value="simulation" pt="md">
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
                  <Box>
                    <Title
                      order={4}
                      style={{ color: "var(--text-main)", fontWeight: 700 }}
                    >
                      What-If Disruption Operations Simulator (Phase 6)
                    </Title>
                    <Text size="xs" style={{ color: "var(--text-muted)" }}>
                      Simulate network disruptions in real time and evaluate
                      detour routing, travel time penalties, fare deltas, and
                      link impassability.
                    </Text>
                  </Box>

                  {/* Simulator Controls */}
                  <Grid gap="sm">
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Select
                        label="Origin Hub"
                        data={DHAKA_HUBS}
                        value={simOrigin}
                        onChange={(v) => setSimOrigin(v || "hub_banasree")}
                        size="xs"
                        comboboxProps={{ withinPortal: true, zIndex: 2000 }}
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Select
                        label="Destination Hub"
                        data={DHAKA_HUBS}
                        value={simDestination}
                        onChange={(v) =>
                          setSimDestination(v || "hub_kawran_bazar")
                        }
                        size="xs"
                        comboboxProps={{ withinPortal: true, zIndex: 2000 }}
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Select
                        label="Simulated Disruption Incident"
                        data={SCENARIOS}
                        value={simScenario}
                        onChange={(v) => setSimScenario(v || "none")}
                        size="xs"
                        comboboxProps={{ withinPortal: true, zIndex: 2000 }}
                      />
                    </Grid.Col>
                  </Grid>

                  <Group justify="space-between" align="center" wrap="wrap">
                    <Switch
                      label="Apply Statutory Student Concession"
                      checked={simStudent}
                      onChange={(e) => setSimStudent(e.currentTarget.checked)}
                      size="xs"
                    />

                    <Button
                      size="xs"
                      radius="xl"
                      leftSection={<IconLayersIntersect size={14} />}
                      onClick={handleRunSimulation}
                      loading={simLoading}
                      styles={{
                        root: {
                          background: "var(--text-main)",
                          color: "var(--bg-page)",
                          fontWeight: 600,
                        },
                      }}
                    >
                      Run Operational Simulation
                    </Button>
                  </Group>

                  {/* Simulation Delta Results */}
                  {simResult && (
                    <Stack gap="md" mt="xs">
                      {/* Delta KPI Cards */}
                      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
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
                            style={{ color: "var(--text-muted)" }}
                          >
                            Travel Time Delta
                          </Text>
                          <Text
                            size="lg"
                            fw={800}
                            style={{
                              color:
                                simResult.durationDelta > 0
                                  ? "#e11900"
                                  : "#00aa66",
                            }}
                          >
                            {simResult.durationDelta >= 0 ? "+" : ""}
                            {simResult.durationDelta} min
                          </Text>
                          <Text
                            size="10px"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Detour time impact
                          </Text>
                        </Paper>

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
                            style={{ color: "var(--text-muted)" }}
                          >
                            Fare Delta
                          </Text>
                          <Text
                            size="lg"
                            fw={800}
                            style={{
                              color:
                                simResult.fareDelta > 0
                                  ? "#ff9900"
                                  : "var(--text-main)",
                            }}
                          >
                            {simResult.fareDelta >= 0 ? "+" : ""}
                            {simResult.fareDelta} ৳
                          </Text>
                          <Text
                            size="10px"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Cost variance
                          </Text>
                        </Paper>

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
                            style={{ color: "var(--text-muted)" }}
                          >
                            Transfer Delta
                          </Text>
                          <Text
                            size="lg"
                            fw={800}
                            style={{ color: "var(--text-main)" }}
                          >
                            {simResult.transfersDelta >= 0 ? "+" : ""}
                            {simResult.transfersDelta}
                          </Text>
                          <Text
                            size="10px"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Mode switches
                          </Text>
                        </Paper>

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
                            style={{ color: "var(--text-muted)" }}
                          >
                            Link Avoidance
                          </Text>
                          <Badge
                            size="xs"
                            variant="filled"
                            style={{
                              background: simResult.impassableAvoided
                                ? "#00aa66"
                                : "var(--text-main)",
                              color: "var(--bg-page)",
                              marginTop: 4,
                            }}
                          >
                            {simResult.impassableAvoided
                              ? "Detour Applied"
                              : "Normal Path"}
                          </Badge>
                          <Text
                            size="10px"
                            style={{ color: "var(--text-muted)", marginTop: 2 }}
                          >
                            Honest routing guarantee
                          </Text>
                        </Paper>
                      </SimpleGrid>

                      {/* Side-by-side Comparative Routes */}
                      <Grid gap="md">
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <Card
                            p="md"
                            radius="md"
                            style={{
                              background: "var(--bg-card-inner)",
                              border: "1px solid #00aa66",
                            }}
                          >
                            <Group justify="space-between" mb="xs">
                              <Badge size="xs" color="green" variant="filled">
                                Baseline Path (No Disruption)
                              </Badge>
                              <Text
                                size="xs"
                                fw={700}
                                style={{ color: "var(--text-main)" }}
                              >
                                {
                                  simResult.baseline.routes?.[0]
                                    ?.totalDurationMin
                                }{" "}
                                min |{" "}
                                {simStudent
                                  ? simResult.baseline.routes?.[0]
                                      ?.fareStudentBdt
                                  : simResult.baseline.routes?.[0]
                                      ?.fareRegularBdt}{" "}
                                ৳
                              </Text>
                            </Group>

                            <Stack gap={6}>
                              {simResult.baseline.routes?.[0]?.legs.map(
                                (leg: any, idx: number) => (
                                  <Group key={idx} justify="space-between">
                                    <Group gap="xs">
                                      <Badge size="xs" variant="outline">
                                        {leg.mode.toUpperCase()}
                                      </Badge>
                                      <Text
                                        size="xs"
                                        style={{ color: "var(--text-main)" }}
                                      >
                                        {leg.fromHubId.replace("hub_", "")} ➔{" "}
                                        {leg.toHubId.replace("hub_", "")}
                                      </Text>
                                    </Group>
                                    <Text
                                      size="xs"
                                      style={{ color: "var(--text-muted)" }}
                                    >
                                      {leg.durationMin}m ({leg.fareRegularBdt}৳)
                                    </Text>
                                  </Group>
                                ),
                              )}
                            </Stack>
                          </Card>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <Card
                            p="md"
                            radius="md"
                            style={{
                              background: "var(--bg-card-inner)",
                              border: "1px solid #ff9900",
                            }}
                          >
                            <Group justify="space-between" mb="xs">
                              <Badge size="xs" color="orange" variant="filled">
                                Disrupted / Detour Path
                              </Badge>
                              <Text
                                size="xs"
                                fw={700}
                                style={{ color: "var(--text-main)" }}
                              >
                                {simResult.disrupted.routes?.[0]
                                  ? `${simResult.disrupted.routes[0].totalDurationMin} min | ${
                                      simStudent
                                        ? simResult.disrupted.routes[0]
                                            .fareStudentBdt
                                        : simResult.disrupted.routes[0]
                                            .fareRegularBdt
                                    } ৳`
                                  : "Impassable"}
                              </Text>
                            </Group>

                            {simResult.disrupted.routes?.[0] ? (
                              <Stack gap={6}>
                                {simResult.disrupted.routes[0].legs.map(
                                  (leg: any, idx: number) => (
                                    <Group key={idx} justify="space-between">
                                      <Group gap="xs">
                                        <Badge size="xs" variant="outline">
                                          {leg.mode.toUpperCase()}
                                        </Badge>
                                        <Text
                                          size="xs"
                                          style={{ color: "var(--text-main)" }}
                                        >
                                          {leg.fromHubId.replace("hub_", "")} ➔{" "}
                                          {leg.toHubId.replace("hub_", "")}
                                        </Text>
                                      </Group>
                                      <Text
                                        size="xs"
                                        style={{ color: "var(--text-muted)" }}
                                      >
                                        {leg.durationMin}m ({leg.fareRegularBdt}
                                        ৳)
                                      </Text>
                                    </Group>
                                  ),
                                )}

                                {simResult.disrupted.routes[0].warnings?.map(
                                  (w: string, idx: number) => (
                                    <Text
                                      key={idx}
                                      size="11px"
                                      style={{ color: "#ff9900" }}
                                    >
                                      ⚠️ {w}
                                    </Text>
                                  ),
                                )}
                              </Stack>
                            ) : (
                              <Alert
                                color="red"
                                title="No Passable Route Found"
                              >
                                All connecting corridors are completely blocked
                                under this disruption scenario.
                              </Alert>
                            )}
                          </Card>
                        </Grid.Col>
                      </Grid>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            </Tabs.Panel>

            {/* TAB 6: AI Key Failover Pool */}
            <Tabs.Panel value="ai_keys" pt="md">
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
                  <Group justify="space-between" align="center" wrap="wrap">
                    <Box>
                      <Group gap="xs">
                        <IconKey
                          size={20}
                          stroke={2}
                          style={{ color: "var(--text-main)" }}
                        />
                        <Title
                          order={4}
                          style={{ color: "var(--text-main)", fontWeight: 700 }}
                        >
                          Google AI Studio Key Pool & Auto-Failover Monitor
                        </Title>
                      </Group>
                      <Text size="xs" style={{ color: "var(--text-muted)" }}>
                        Multi-key circuit breaker connecting all 5 API keys with
                        automatic rate-limit detection and immediate failover.
                      </Text>
                    </Box>

                    <Group gap="xs">
                      <Badge size="sm" radius="xl" variant="outline">
                        Model: {aiPoolData?.model || "gemini-3.5-flash"}
                      </Badge>
                      <Button
                        size="xs"
                        radius="xl"
                        variant="default"
                        leftSection={
                          aiPoolLoading ? (
                            <Loader size={12} color="gray" />
                          ) : (
                            <IconRefresh size={14} />
                          )
                        }
                        onClick={fetchAiPool}
                        disabled={aiPoolLoading}
                      >
                        Refresh Pool Status
                      </Button>
                    </Group>
                  </Group>

                  {/* Key Pool KPI Stats */}
                  <Grid gap="sm">
                    <Grid.Col span={{ base: 6, sm: 3 }}>
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
                          style={{ color: "var(--text-muted)" }}
                        >
                          Total Keys Configured
                        </Text>
                        <Text
                          size="xl"
                          fw={800}
                          style={{ color: "var(--text-main)" }}
                        >
                          {aiPoolData?.totalKeys || 5}
                        </Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={{ base: 6, sm: 3 }}>
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
                          style={{ color: "var(--text-muted)" }}
                        >
                          Active & Healthy
                        </Text>
                        <Text
                          size="xl"
                          fw={800}
                          style={{ color: "var(--text-main)" }}
                        >
                          {aiPoolData?.activeKeysCount ?? 5}
                        </Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={{ base: 6, sm: 3 }}>
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
                          style={{ color: "var(--text-muted)" }}
                        >
                          In Cooldown Window
                        </Text>
                        <Text
                          size="xl"
                          fw={800}
                          style={{ color: "var(--text-main)" }}
                        >
                          {aiPoolData?.cooldownKeysCount ?? 0}
                        </Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={{ base: 6, sm: 3 }}>
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
                          style={{ color: "var(--text-muted)" }}
                        >
                          Failover Algorithm
                        </Text>
                        <Badge size="xs" radius="xl" variant="filled" mt={4}>
                          Circuit Breaker Active
                        </Badge>
                      </Paper>
                    </Grid.Col>
                  </Grid>

                  {/* Keys Telemetry Table */}
                  <Table highlightOnHover withTableBorder verticalSpacing="xs">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Key ID
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Fingerprint
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Status
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Requests / Successes
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Cooldown
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Last Code
                        </Table.Th>
                        <Table.Th style={{ color: "var(--text-main)" }}>
                          Notes
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {aiPoolData?.pool?.map((item: any) => (
                        <Table.Tr key={item.id}>
                          <Table.Td
                            fw={700}
                            style={{ color: "var(--text-main)" }}
                          >
                            Key #{item.id}
                          </Table.Td>
                          <Table.Td
                            style={{ fontFamily: "monospace", fontSize: 12 }}
                          >
                            {item.maskedKey}
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              size="xs"
                              radius="sm"
                              variant="filled"
                              style={{
                                background:
                                  item.status === "healthy"
                                    ? "var(--text-main)"
                                    : "#e11900",
                                color: "var(--bg-page)",
                                fontWeight: 700,
                              }}
                            >
                              {item.status === "healthy"
                                ? "● Healthy"
                                : item.status === "cooldown"
                                  ? `⏳ Cooldown (${item.cooldownRemainingSec}s)`
                                  : "⛔ Limit Hit"}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs">
                              {item.totalRequests} reqs ({item.totalSuccesses}{" "}
                              ok)
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text
                              size="xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {item.cooldownRemainingSec > 0
                                ? `${item.cooldownRemainingSec}s remaining`
                                : "Ready"}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            {item.lastStatusCode ? (
                              <Badge size="xs" radius="sm" variant="outline">
                                HTTP {item.lastStatusCode}
                              </Badge>
                            ) : (
                              <Text
                                size="xs"
                                style={{ color: "var(--text-muted)" }}
                              >
                                Standby
                              </Text>
                            )}
                          </Table.Td>
                          <Table.Td style={{ maxWidth: 220 }}>
                            <Text
                              size="11px"
                              style={{ color: "var(--text-muted)" }}
                              truncate="end"
                            >
                              {item.lastErrorMessage || "Operational"}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Stack>
              </Paper>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>

      {/* MODAL 1: Dispatch Official Incident Alert */}
      <Modal
        opened={createAlertOpened}
        onClose={closeCreateAlert}
        title={
          <Group gap="xs">
            <IconAlertTriangle size={18} />
            <Text fw={700}>Dispatch Official Incident Alert</Text>
          </Group>
        }
        radius="lg"
      >
        <Stack gap="sm">
          <TextInput
            label="Incident Title (English)"
            placeholder="e.g. Airport Road Waterlogging"
            required
            value={newAlertTitle}
            onChange={(e) => setNewAlertTitle(e.currentTarget.value)}
          />
          <TextInput
            label="Incident Title (Bengali)"
            placeholder="e.g. বিমানবন্দর সড়কে তীব্র জলাবদ্ধতা"
            value={newAlertTitleBn}
            onChange={(e) => setNewAlertTitleBn(e.currentTarget.value)}
          />
          <Select
            label="Incident Severity"
            data={[
              { value: "low", label: "Low (Minor dwell delays)" },
              { value: "medium", label: "Medium (15-20 min delays)" },
              { value: "high", label: "High (Heavy delays & rerouting)" },
              { value: "critical", label: "Critical (Complete impassability)" },
            ]}
            value={newAlertSeverity}
            onChange={(v) => setNewAlertSeverity(v || "medium")}
          />
          <MultiSelect
            label="Affected Transit Modes"
            data={[
              { value: "bus", label: "City Bus" },
              { value: "metro", label: "Metro Rail" },
              { value: "leguna", label: "Leguna (Human Hauler)" },
              { value: "rickshaw", label: "Rickshaw" },
              { value: "walk", label: "Pedestrian / Walk" },
            ]}
            value={newAlertModes}
            onChange={setNewAlertModes}
          />
          <NumberInput
            label="Estimated Commuter Delay (minutes)"
            min={0}
            max={360}
            value={newAlertDelay}
            onChange={(v) => setNewAlertDelay(Number(v) || 0)}
          />
          <Switch
            label="Is Road / Corridor Completely Impassable (Blocked)?"
            checked={newAlertIsClosed}
            onChange={(e) => setNewAlertIsClosed(e.currentTarget.checked)}
          />
          <Textarea
            label="Commuter Advisory / Description"
            placeholder="Provide detour recommendations or reason for delay..."
            rows={3}
            value={newAlertDesc}
            onChange={(e) => setNewAlertDesc(e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeCreateAlert}>
              Cancel
            </Button>
            <Button
              onClick={handleDispatchAdminAlert}
              loading={dispatchingAlert}
              styles={{
                root: {
                  background: "var(--text-main)",
                  color: "var(--bg-page)",
                  fontWeight: 600,
                },
              }}
            >
              Broadcast Alert
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* MODAL 2: Register New Transit Service */}
      <Modal
        opened={createServiceOpened}
        onClose={closeCreateService}
        title={
          <Group gap="xs">
            <IconBus size={18} />
            <Text fw={700}>Register Transit Service into CMS</Text>
          </Group>
        }
        radius="lg"
      >
        <Stack gap="sm">
          <TextInput
            label="Service Name"
            placeholder="e.g. Al-Makkah Paribahan"
            required
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.currentTarget.value)}
          />
          <Select
            label="Transit Mode"
            data={[
              { value: "bus", label: "City Bus" },
              { value: "metro", label: "Metro Rail" },
              { value: "leguna", label: "Human Hauler / Leguna" },
              { value: "rickshaw", label: "Rickshaw Syndicate" },
            ]}
            value={newServiceMode}
            onChange={(v) => setNewServiceMode(v || "bus")}
          />
          <TextInput
            label="Route Code"
            placeholder="e.g. MAK-01"
            value={newServiceCode}
            onChange={(e) => setNewServiceCode(e.currentTarget.value)}
          />
          <TextInput
            label="Operator Company / Syndicate"
            placeholder="e.g. Dhaka City Bus Transport Ltd."
            value={newServiceOp}
            onChange={(e) => setNewServiceOp(e.currentTarget.value)}
          />
          <Textarea
            label="Route Description & Stoppages"
            placeholder="Key arterial stops traversed by this service..."
            rows={3}
            value={newServiceDesc}
            onChange={(e) => setNewServiceDesc(e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeCreateService}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateService}
              loading={savingService}
              styles={{
                root: {
                  background: "var(--text-main)",
                  color: "var(--bg-page)",
                  fontWeight: 600,
                },
              }}
            >
              Save Service
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* MODAL 3: Edit Statutory Fare Policy Rule */}
      <Modal
        opened={editFareOpened}
        onClose={closeEditFare}
        title={
          <Group gap="xs">
            <IconCoins size={18} />
            <Text fw={700}>
              Edit Fare Policy:{" "}
              {selectedFareRule?.serviceName || selectedFareRule?.mode}
            </Text>
          </Group>
        }
        radius="lg"
      >
        <Stack gap="sm">
          <NumberInput
            label="Regular Tariff (BDT)"
            min={0}
            value={editingRegularFare}
            onChange={(v) => setEditingRegularFare(Number(v) || 0)}
          />
          <Group grow>
            <NumberInput
              label="Minimum Fare Floor (BDT)"
              min={0}
              value={editingMinFare}
              onChange={(v) => setEditingMinFare(Number(v) || 0)}
            />
            <NumberInput
              label="Maximum Cap (BDT)"
              min={0}
              value={editingMaxFare}
              onChange={(v) => setEditingMaxFare(Number(v) || 0)}
            />
          </Group>
          <Switch
            label="Student Concession Eligible"
            checked={editingStudentEligible}
            onChange={(e) => setEditingStudentEligible(e.currentTarget.checked)}
          />
          {editingStudentEligible && (
            <Group grow>
              <NumberInput
                label="Student Discount (%)"
                min={0}
                max={100}
                value={editingStudentPct}
                onChange={(v) => setEditingStudentPct(Number(v) || 0)}
              />
              <NumberInput
                label="Statutory Student Floor (BDT)"
                min={0}
                value={editingStudentFloor}
                onChange={(v) => setEditingStudentFloor(Number(v) || 0)}
              />
            </Group>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeEditFare}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveFareRule}
              loading={savingFare}
              styles={{
                root: {
                  background: "var(--text-main)",
                  color: "var(--bg-page)",
                  fontWeight: 600,
                },
              }}
            >
              Update Policy
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* MODAL 4: OCR Submission Review & Human-in-the-Loop Verification */}
      <Modal
        opened={ocrReviewOpened}
        onClose={closeOcrReview}
        size="xl"
        title={
          <Group gap="xs">
            <IconScan size={18} />
            <Text fw={700}>
              Verify Signboard Notice: {selectedOcrSub?.receiptCode}
            </Text>
          </Group>
        }
        radius="lg"
      >
        {selectedOcrSub && (
          <Stack gap="md">
            <Grid gap="md">
              {/* Left Column: Image / Raw OCR */}
              <Grid.Col span={{ base: 12, md: 5 }}>
                <Stack gap="xs">
                  <Text
                    size="xs"
                    fw={700}
                    style={{ color: "var(--text-muted)" }}
                  >
                    Original Captured Photo / Notice
                  </Text>
                  <Paper
                    p="sm"
                    radius="md"
                    style={{
                      background: "var(--bg-card-inner)",
                      border: "1px solid var(--border-subtle)",
                      textAlign: "center",
                    }}
                  >
                    <IconFileText
                      size={32}
                      style={{ opacity: 0.5, marginBottom: 4 }}
                    />
                    <Text size="xs" fw={700}>
                      {selectedOcrSub.imageName || "Signboard Upload"}
                    </Text>
                    <Text size="10px" style={{ color: "var(--text-muted)" }}>
                      Submitted on{" "}
                      {new Date(selectedOcrSub.submittedAt).toLocaleString()}
                    </Text>
                  </Paper>

                  <Text
                    size="xs"
                    fw={700}
                    style={{ color: "var(--text-muted)", marginTop: 6 }}
                  >
                    Raw Optical Transcribed Text
                  </Text>
                  <Box
                    p="xs"
                    style={{
                      background: "var(--bg-card-inner)",
                      borderRadius: 6,
                      fontFamily: "monospace",
                      fontSize: "11px",
                      whiteSpace: "pre-wrap",
                      maxHeight: 140,
                      overflowY: "auto",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {selectedOcrSub.rawText || "No text available"}
                  </Box>

                  {/* Commuter Submitted Notes */}
                  {selectedOcrSub.userNotes && (
                    <Alert color="blue" title="Commuter Field Notes" p="xs">
                      <Text size="xs">{selectedOcrSub.userNotes}</Text>
                    </Alert>
                  )}
                </Stack>
              </Grid.Col>

              {/* Right Column: Database Cross-Verification & Editable Fields */}
              <Grid.Col span={{ base: 12, md: 7 }}>
                <Stack gap="xs">
                  {/* Database Cross-Validation Box */}
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
                      <Text size="xs" fw={700}>
                        Database Cross-Validation Audit:
                      </Text>
                    </Group>
                    <Text
                      size="11px"
                      style={{ color: "var(--text-muted)", lineHeight: 1.4 }}
                    >
                      • <strong>Origin:</strong>{" "}
                      {selectedOcrSub.dbMatch?.originMatchedHub
                        ? `Matched ${selectedOcrSub.dbMatch.originMatchedHub.name_en}`
                        : "Unmapped / External"}
                      <br />• <strong>Destination:</strong>{" "}
                      {selectedOcrSub.dbMatch?.destinationMatchedHub
                        ? `Matched ${selectedOcrSub.dbMatch.destinationMatchedHub.name_en}`
                        : "Unmapped / External"}
                      <br />• <strong>Statutory Fare Analysis:</strong>{" "}
                      {
                        selectedOcrSub.dbMatch?.statutoryFareValidation
                          ?.auditNote
                      }
                    </Text>
                  </Paper>

                  {/* Editable Fields by Admin */}
                  <SimpleGrid cols={2} spacing="xs">
                    <TextInput
                      size="xs"
                      label="Service Name"
                      value={adminOcrName}
                      onChange={(e) => setAdminOcrName(e.currentTarget.value)}
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
                      value={adminOcrMode}
                      onChange={(v) => setAdminOcrMode(v || "bus")}
                    />
                  </SimpleGrid>

                  <TextInput
                    size="xs"
                    label="Operator Syndicate"
                    value={adminOcrOperator}
                    onChange={(e) => setAdminOcrOperator(e.currentTarget.value)}
                  />

                  <SimpleGrid cols={2} spacing="xs">
                    <TextInput
                      size="xs"
                      label="Origin Terminus"
                      value={adminOcrOrigin}
                      onChange={(e) => setAdminOcrOrigin(e.currentTarget.value)}
                    />
                    <TextInput
                      size="xs"
                      label="Destination Terminus"
                      value={adminOcrDestination}
                      onChange={(e) =>
                        setAdminOcrDestination(e.currentTarget.value)
                      }
                    />
                  </SimpleGrid>

                  <TextInput
                    size="xs"
                    label="Via Stoppages (Comma separated)"
                    value={adminOcrVia}
                    onChange={(e) => setAdminOcrVia(e.currentTarget.value)}
                  />

                  <SimpleGrid cols={2} spacing="xs">
                    <NumberInput
                      size="xs"
                      label="Regular Fare (BDT)"
                      value={adminOcrFareReg}
                      onChange={(v) =>
                        setAdminOcrFareReg(v === "" ? "" : Number(v))
                      }
                    />
                    <NumberInput
                      size="xs"
                      label="Student Concession (BDT)"
                      value={adminOcrFareStudent}
                      onChange={(v) =>
                        setAdminOcrFareStudent(v === "" ? "" : Number(v))
                      }
                    />
                  </SimpleGrid>

                  <TextInput
                    size="xs"
                    label="Boarding Landmark"
                    value={adminOcrLandmark}
                    onChange={(e) => setAdminOcrLandmark(e.currentTarget.value)}
                  />

                  <Textarea
                    size="xs"
                    label="Admin Verification Notes"
                    placeholder="Provide audit notes or reasons for approval/rejection..."
                    rows={2}
                    value={adminReviewNotes}
                    onChange={(e) => setAdminReviewNotes(e.currentTarget.value)}
                  />
                </Stack>
              </Grid.Col>
            </Grid>

            {/* Actions Bar */}
            <Group justify="space-between" mt="md">
              <Button
                variant="subtle"
                color="red"
                onClick={handleRejectOcrSubmission}
                loading={processingOcr}
              >
                Reject Notice
              </Button>

              <Group gap="xs">
                <Button variant="default" onClick={closeOcrReview}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleApproveOcrSubmission(true)}
                  loading={processingOcr}
                  styles={{
                    root: {
                      background: "var(--text-main)",
                      color: "var(--bg-page)",
                      fontWeight: 600,
                    },
                  }}
                >
                  Approve & Publish to Transit CMS
                </Button>
              </Group>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
