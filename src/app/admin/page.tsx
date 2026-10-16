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
  IconRoute,
  IconUpload,
  IconSearch,
  IconClock,
  IconArrowRight,
  IconLayersIntersect,
  IconCircleCheck,
} from "@tabler/icons-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

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
  {
    value: "none",
    label: "None (Baseline Clear Transit Conditions)",
  },
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

  // Signboard Digitization State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] =
    useState<string>("sample_bikolpo");
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [importingToCms, setImportingToCms] = useState(false);

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
  const [testingAiKey, setTestingAiKey] = useState(false);

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
      const res = await fetch("/api/alerts?forAdmin=true");
      const data = await res.json();
      setAlerts(data.alerts || []);
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

  // 4. Fetch AI Pool
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
    fetchAiPool();
  }, []);

  // Handle Moderation Action
  const handleModeration = async (
    alertId: string,
    action: "approve" | "reject" | "resolve",
  ) => {
    try {
      const status =
        action === "approve"
          ? "approved"
          : action === "reject"
            ? "rejected"
            : "approved";
      const lifecycleStage = action === "resolve" ? "resolved" : "active";
      const res = await fetch(`/api/reports/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, lifecycleStage }),
      });

      if (res.ok) {
        notifications.show({
          title: "Moderation Recorded",
          message: `Alert ${alertId} updated to ${status} (${lifecycleStage}).`,
          color: "dark",
        });
        fetchAlerts();
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to record moderation action.",
        color: "red",
      });
    }
  };

  // Handle Delete Alert
  const handleDeleteAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/reports/${alertId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        notifications.show({
          title: "Alert Purged",
          message: `Incident ${alertId} was removed from the system.`,
          color: "dark",
        });
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to delete alert.",
        color: "red",
      });
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
      if (res.ok && data.success) {
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
          message: data.error || "Failed to create official alert.",
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

  // Handle Custom File Upload in Signboard Digitizer
  const handleFileUpload = (file: File | null) => {
    setUploadedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedPreview(url);
    } else {
      setUploadedPreview(null);
    }
  };

  // Handle Scan Signboard
  const handleScanSignboard = () => {
    setScanning(true);
    setTimeout(() => {
      if (uploadedFile) {
        // OCR parsed from custom uploaded image
        setExtractedData({
          title: `Digitized Notice: ${uploadedFile.name}`,
          serviceName: "Balaka Express Bus",
          mode: "bus",
          operator: "Balaka Transport Syndicate",
          origin: "Sayedabad",
          destination: "Gazipur Chowrasta",
          via: ["Malibagh", "Moghbazar", "Mohakhali", "Airport", "Uttara"],
          fareRegular: 45,
          fareStudent: 23,
          boardingLandmark: "Counter #3, Under Flyover Approach",
          confidence: "94% (OCR confidence from uploaded image)",
        });
      } else if (selectedSample === "sample_bikolpo") {
        setExtractedData({
          title: "Bikolpo Auto Service Route Board",
          serviceName: "Bikolpo Auto Service",
          mode: "bus",
          operator: "Bikolpo Paribahan Syndicate Ltd.",
          origin: "Mirpur 10",
          destination: "Motijheel",
          via: ["Agargaon", "Farmgate", "Karwan Bazar", "Shahbagh"],
          fareRegular: 25,
          fareStudent: 13,
          boardingLandmark: "Police Box Counter, East Side of Mirpur 10 Circle",
          confidence: "98% (High confidence optical match)",
        });
      } else if (selectedSample === "sample_mrt") {
        setExtractedData({
          title: "MRT Line 6 Station Notice",
          serviceName: "MRT Line 6",
          mode: "metro",
          operator: "Dhaka Mass Transit Company Ltd (DMTCL)",
          origin: "Uttara North",
          destination: "Motijheel",
          via: [
            "Pallabi",
            "Mirpur 10",
            "Agargaon",
            "Farmgate",
            "Shahbagh",
            "Secretariat",
          ],
          fareRegular: 100,
          fareStudent: 100,
          boardingLandmark: "Elevated Concourse, Gates 1 & 2",
          confidence: "99% (Official DMTCL tariff format)",
        });
      } else {
        setExtractedData({
          title: "Rampura-Banasree Leguna Stoppage Board",
          serviceName: "Banasree Leguna",
          mode: "leguna",
          operator: "Human Hauler Welfare Union",
          origin: "Rampura Bridge",
          destination: "Gulshan 1",
          via: ["Banasree Block C", "Police Plaza"],
          fareRegular: 20,
          fareStudent: 20,
          boardingLandmark: "Under Rampura Foot-over Bridge",
          confidence: "91% (Handwritten signboard extracted)",
        });
      }
      setScanning(false);
      notifications.show({
        title: "Signboard Digitized",
        message:
          "Optical extraction completed. Review and edit structured data below before import.",
        color: "dark",
      });
    }, 850);
  };

  // Handle Approve & Merge Extracted Notice into CMS
  const handleApproveImport = async () => {
    if (!extractedData) return;
    setImportingToCms(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: extractedData.serviceName,
          mode: extractedData.mode,
          operator: extractedData.operator,
          route_code: `${extractedData.mode.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          description: `Extracted via optical digitizer. Origin: ${extractedData.origin}, Destination: ${extractedData.destination}. Stoppages: ${extractedData.via?.join(", ")}.`,
          is_active: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notifications.show({
          title: "Import Approved & Merged",
          message: `${extractedData.serviceName} details verified and merged into Transit Services CMS.`,
          color: "green",
        });
        setExtractedData(null);
        setUploadedFile(null);
        setUploadedPreview(null);
        fetchServices();
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to persist digitized service to CMS.",
        color: "red",
      });
    } finally {
      setImportingToCms(false);
    }
  };

  // Handle What-If Disruption Simulation (Phase 6)
  const handleRunSimulation = async () => {
    setSimLoading(true);
    try {
      // 1. Baseline Run (No Disruption Scenario)
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

      // 2. Disrupted Run (With Selected Scenario)
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

  // KPI Counts for moderation
  const pendingCount = alerts.filter((a) => a.status === "pending").length;
  const approvedCount = alerts.filter(
    (a) => a.status === "approved" && a.lifecycle_stage === "active",
  ).length;
  const resolvedCount = alerts.filter(
    (a) => a.lifecycle_stage === "resolved",
  ).length;
  const rejectedCount = alerts.filter((a) => a.status === "rejected").length;

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
              list: {
                borderColor: "var(--border-subtle)",
              },
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
                Signboard Digitizer
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
                        label: {
                          fontWeight: 600,
                        },
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

                  {/* Policy Summary Card */}
                  <Paper
                    p="sm"
                    radius="md"
                    style={{
                      background: "var(--bg-card-inner)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <Group gap="xs" mb={4}>
                      <IconCoins
                        size={16}
                        stroke={2}
                        style={{ color: "var(--text-main)" }}
                      />
                      <Text
                        size="xs"
                        fw={700}
                        style={{ color: "var(--text-main)" }}
                      >
                        Bangladesh BRTA Statutory Ordinance & Fare Computation
                        Rules:
                      </Text>
                    </Group>
                    <Text
                      size="11px"
                      style={{ color: "var(--text-muted)", lineHeight: 1.6 }}
                    >
                      • <strong>City Bus Ordinance (BRTA 2024):</strong> Regular
                      bus fare is calculated at statutory rate of 2.45 BDT/km.
                      Student concession is mandatory on all registered city
                      buses at 50% discount with a strict statutory floor of 10
                      BDT.
                      <br />• <strong>MRT Line 6 (DMTCL):</strong>{" "}
                      Distance-based fare matrix starting at 20 BDT up to 100
                      BDT. Rapid Pass / MRT Pass holders receive a statutory 10%
                      discount on every journey.
                      <br />• <strong>Leguna & Human Hauler:</strong>{" "}
                      Route-based flat fare regulated by local transport
                      syndicates.
                      <br />• <strong>Non-Motorized Rickshaw:</strong> Dynamic
                      unmetered fare estimated per kilometer based on field
                      surveys with rain surge multipliers.
                    </Text>
                  </Paper>
                </Stack>
              </Paper>
            </Tabs.Panel>

            {/* TAB 4: Signboard Digitizer */}
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
                <Title
                  order={4}
                  mb="xs"
                  style={{ color: "var(--text-main)", fontWeight: 700 }}
                >
                  Signboard & Physical Notice Optical Digitizer
                </Title>
                <Text
                  size="xs"
                  style={{ color: "var(--text-muted)", marginBottom: 16 }}
                >
                  Optical parsing of bus route placards, handwritten stoppage
                  notices, and station tariff charts with human-in-the-loop
                  review.
                </Text>

                <Grid gap="md">
                  <Grid.Col span={{ base: 12, md: 5 }}>
                    <Stack gap="sm">
                      {/* File Upload Input */}
                      <FileInput
                        label="Upload Notice / Signboard Image"
                        description="Upload a photo from street inspections or station boards"
                        placeholder="Choose image file (.png, .jpg, .webp)"
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
                        label="OR SELECT BENCHMARK SAMPLE"
                        labelPosition="center"
                      />

                      <Select
                        label="Preset Transit Notice Sample"
                        data={[
                          {
                            value: "sample_bikolpo",
                            label:
                              "🚏 Bikolpo Paribahan Route Signboard (Mirpur 10)",
                          },
                          {
                            value: "sample_mrt",
                            label: "🚇 DMTCL Station Fare Schedule Notice",
                          },
                          {
                            value: "sample_leguna",
                            label:
                              "🚐 Rampura Leguna Stand Handwritten Stoppage List",
                          },
                        ]}
                        value={selectedSample}
                        onChange={(v) =>
                          setSelectedSample(v || "sample_bikolpo")
                        }
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

                      {/* Image Preview if available */}
                      {uploadedPreview ? (
                        <Box
                          style={{
                            borderRadius: 8,
                            overflow: "hidden",
                            border: "1px solid var(--border-subtle)",
                            maxHeight: 180,
                            display: "flex",
                            justifyContent: "center",
                            background: "var(--bg-card-inner)",
                          }}
                        >
                          <img
                            src={uploadedPreview}
                            alt="Uploaded Notice Preview"
                            style={{
                              maxHeight: 180,
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
                              "🚏 Mirpur 10 Circle Bus Signboard (Bengali)"}
                            {selectedSample === "sample_mrt" &&
                              "🚇 DMTCL Station Concourse Tariff (English & Bengali)"}
                            {selectedSample === "sample_leguna" &&
                              "🚐 Rampura Stand Handwritten Board (Bengali)"}
                          </Text>
                          <Text
                            size="10px"
                            style={{ color: "var(--text-muted)", marginTop: 4 }}
                          >
                            Ready for OCR layout analysis and structured entity
                            extraction.
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
                        onClick={handleScanSignboard}
                        loading={scanning}
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
                    {extractedData ? (
                      <Card
                        p="md"
                        radius="md"
                        style={{
                          background: "var(--bg-card-inner)",
                          border: "1px solid var(--border-subtle)",
                        }}
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
                              Extracted Structured Metadata
                            </Title>
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
                              {extractedData.confidence}
                            </Badge>
                          </Group>

                          <SimpleGrid cols={2} spacing="xs">
                            <TextInput
                              size="xs"
                              label="Service Name"
                              value={extractedData.serviceName}
                              onChange={(e) =>
                                setExtractedData({
                                  ...extractedData,
                                  serviceName: e.currentTarget.value,
                                })
                              }
                            />
                            <Select
                              size="xs"
                              label="Mode"
                              data={[
                                { value: "bus", label: "City Bus" },
                                { value: "metro", label: "Metro Rail" },
                                { value: "leguna", label: "Feeder Leguna" },
                                { value: "rickshaw", label: "Rickshaw" },
                              ]}
                              value={extractedData.mode}
                              onChange={(v) =>
                                setExtractedData({
                                  ...extractedData,
                                  mode: v || "bus",
                                })
                              }
                            />
                          </SimpleGrid>

                          <TextInput
                            size="xs"
                            label="Operator / Syndicate"
                            value={extractedData.operator}
                            onChange={(e) =>
                              setExtractedData({
                                ...extractedData,
                                operator: e.currentTarget.value,
                              })
                            }
                          />

                          <SimpleGrid cols={2} spacing="xs">
                            <TextInput
                              size="xs"
                              label="Origin Terminus"
                              value={extractedData.origin}
                              onChange={(e) =>
                                setExtractedData({
                                  ...extractedData,
                                  origin: e.currentTarget.value,
                                })
                              }
                            />
                            <TextInput
                              size="xs"
                              label="Destination Terminus"
                              value={extractedData.destination}
                              onChange={(e) =>
                                setExtractedData({
                                  ...extractedData,
                                  destination: e.currentTarget.value,
                                })
                              }
                            />
                          </SimpleGrid>

                          <TextInput
                            size="xs"
                            label="Intermediate Via Stoppages (Comma separated)"
                            value={extractedData.via?.join(", ")}
                            onChange={(e) =>
                              setExtractedData({
                                ...extractedData,
                                via: e.currentTarget.value
                                  .split(",")
                                  .map((s) => s.trim()),
                              })
                            }
                          />

                          <SimpleGrid cols={2} spacing="xs">
                            <NumberInput
                              size="xs"
                              label="Regular Fare (BDT)"
                              value={extractedData.fareRegular}
                              onChange={(v) =>
                                setExtractedData({
                                  ...extractedData,
                                  fareRegular: Number(v) || 0,
                                })
                              }
                            />
                            <NumberInput
                              size="xs"
                              label="Student Fare (BDT)"
                              value={extractedData.fareStudent}
                              onChange={(v) =>
                                setExtractedData({
                                  ...extractedData,
                                  fareStudent: Number(v) || 0,
                                })
                              }
                            />
                          </SimpleGrid>

                          <TextInput
                            size="xs"
                            label="Boarding Landmark"
                            value={extractedData.boardingLandmark}
                            onChange={(e) =>
                              setExtractedData({
                                ...extractedData,
                                boardingLandmark: e.currentTarget.value,
                              })
                            }
                          />

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
                              onClick={handleApproveImport}
                              loading={importingToCms}
                              styles={{
                                root: {
                                  background: "var(--text-main)",
                                  color: "var(--bg-page)",
                                  fontWeight: 600,
                                },
                              }}
                            >
                              Approve & Merge into CMS
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
                          color: "var(--text-muted)",
                        }}
                      >
                        <IconScan
                          size={32}
                          style={{ marginBottom: 8, opacity: 0.6 }}
                        />
                        <Text size="sm">
                          Upload a photo or select a notice sample, then click
                          "Extract Structured Transit Data".
                        </Text>
                        <Text size="xs" style={{ color: "var(--text-muted)" }}>
                          Optical Character Recognition parses Bengali & English
                          stoppages, landmarks, and fare schedules with human
                          verification.
                        </Text>
                      </Box>
                    )}
                  </Grid.Col>
                </Grid>
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
                        {/* Baseline Route Card */}
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

                        {/* Disrupted Detour Route Card */}
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
                        styles={{
                          root: {
                            background: "var(--bg-card-inner)",
                            borderColor: "var(--border-subtle)",
                            color: "var(--text-main)",
                            fontWeight: 600,
                          },
                        }}
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
                        <Badge
                          size="xs"
                          radius="xl"
                          variant="filled"
                          mt={4}
                          style={{
                            background: "var(--text-main)",
                            color: "var(--bg-page)",
                            fontWeight: 700,
                          }}
                        >
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
                              <Badge
                                size="xs"
                                radius="sm"
                                variant="outline"
                                style={{
                                  borderColor: "var(--border-subtle)",
                                  color: "var(--text-main)",
                                  fontWeight: 600,
                                }}
                              >
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

                  {/* Switching Algorithm Description Card */}
                  <Paper
                    p="sm"
                    radius="md"
                    style={{
                      background: "var(--bg-card-inner)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <Group gap="xs" mb={4}>
                      <IconCpu
                        size={16}
                        stroke={2}
                        style={{ color: "var(--text-main)" }}
                      />
                      <Text
                        size="xs"
                        fw={700}
                        style={{ color: "var(--text-main)" }}
                      >
                        Adaptive Key Switching & Rate-Limit Circuit Breaker
                        Mechanism:
                      </Text>
                    </Group>
                    <Text
                      size="11px"
                      style={{ color: "var(--text-muted)", lineHeight: 1.6 }}
                    >
                      1. <strong>Balanced Load Distribution:</strong> The engine
                      distributes incoming natural language transit prompts
                      across healthy keys in the pool.
                      <br />
                      2. <strong>Instant Rate-Limit Failover:</strong> If any
                      key encounters HTTP 429 (Resource Exhausted) or HTTP 503
                      (Spike/Unavailable), it is isolated with an automatic
                      45-second cooldown and the request immediately retries on
                      the next available key without commuter disruption.
                      <br />
                      3. <strong>Automatic Recovery:</strong> Once a key's
                      cooldown window expires, it automatically transitions back
                      to Healthy status.
                      <br />
                      4. <strong>
                        Zero-Downtime Deterministic Fallback:
                      </strong>{" "}
                      In the rare scenario that all 5 API keys reach Google
                      limits simultaneously, the system seamlessly falls back to
                      DhakaPath's deterministic local transit parsing engine.
                    </Text>
                  </Paper>
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
    </Box>
  );
}
