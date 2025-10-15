import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { api } from "../../services/api";
import { Helmet } from "react-helmet-async";
import { debounce } from "lodash";
import { Modal, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom"; // ✅ Correct import
import Select from "react-select";
import axios from "axios";
import { Card } from "react-bootstrap";
import { NavLink } from "react-router-dom";

const Spinner = ({ message = "Loading..." }) => (
    <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{message}</span>
        </div>
    </div>
);

const paymentOptions = [
    { value: "Cash", label: "Cash" },
    { value: "Credit", label: "Credit" },
    { value: "Bank", label: "Bank" },
];

const paymentStatusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Partial", label: "Partial" },
    { value: "Paid", label: "Paid" },
];



export const ChallanInvoicePage = () => {
    const [purchaseData, setPurchaseData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPurchaseId, setEditingPurchaseId] = useState(null);
    const [purchaseOptions, setPurchaseOptions] = useState([]);
    const [supplierFilterOptions, setSupplierFilterOptions] = useState([]);
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");
    const [selectedSupplierId, setSelectedSupplierId] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [pageLoading, setPageLoading] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        from: 0,
        to: 0,
    });
    const [searchText, setSearchText] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [perPage, setPerPage] = useState(25);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showLotModal, setShowLotModal] = useState(false);
    const [lotDetails, setLotDetails] = useState([]);

    const [activeTab, setActiveTab] = useState("challan");
    const handleTabClick = (tab) => setActiveTab(tab);

    const handleViewLots = async (purchaseId) => {
        try {
            const response = await api.get(`/api/purchase/${purchaseId}/taka-details`);
            setEditingPurchaseId(purchaseId); // store purchase_id
            setLotDetails(response.data.data || []);
            setShowLotModal(true);
        } catch (error) {
            toast.error("Failed to fetch lot details");
            console.error(error);
        }
    };

    const [purchaseForm, setPurchaseForm] = useState({
        supplier_id: "",
        challan_no: "",
        challan_date: "",
        invoice_no: "",
        invoice_date: "",
        notes: "",
        lot_no: "",
    });
    const navigate = useNavigate();

    useEffect(() => {
        // Axios response interceptor
        axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    alert("Session expired. Please login again.");
                    navigate("/api/login"); // Redirect to login page
                }
                return Promise.reject(error);
            }
        );
    }, [navigate]);

    const initialFetch = useRef(true);

    // Centralized error handling
    const handleApiError = (error, defaultMessage) => {
        console.error("API Error:", error);
        toast.error(error.response?.data?.message || defaultMessage);
    };



    useEffect(() => {
        if (initialFetch.current) {
            initialFetch.current = false;
            fetchInitialData();
        }
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchPurchaseData(), fetchSupplierOptions(), fetchSupplierFilterOptions()]);
        } catch (error) {
            handleApiError(error, "Failed to load initial data.");
        } finally {
            setLoading(false);
        }
    };

    const fetchSupplierOptions = async () => {
        try {
            const response = await api.get("/api/get-supplier");
            if (response.data && Array.isArray(response.data)) {
                setPurchaseOptions(
                    response.data.map((supplier) => ({
                        value: supplier.id,
                        label: supplier.name,
                    }))
                );
            } else {
                toast.error("Failed to load suppliers.");
            }
        } catch (error) {
            handleApiError(error, "Error fetching suppliers.");
        }
    };

    const fetchSupplierFilterOptions = async () => {
        try {
            const response = await api.get("/api/fetch-purchase-order-suppliers");
            if (response.data?.success && Array.isArray(response.data.data)) {
                setSupplierFilterOptions(
                    response.data.data.map((supplier) => ({
                        value: supplier.supplier_id,
                        label: supplier.supplier_name,
                    }))
                );
            } else {
                toast.error("Failed to load suppliers.");
            }
        } catch (error) {
            handleApiError(error, "Error fetching suppliers.");
        }
    };

    const fetchPurchaseData = useCallback(
        async (page = 1, supplier = "", startDate = "", endDate = "", perPageCount = perPage) => {
            setPageLoading(true);
            try {
                const response = await api.get("/api/fetch-purchase-order-table-data", {
                    params: {
                        page,
                        supplier_id: supplier,
                        start_date: startDate,
                        end_date: endDate,
                        per_page: perPageCount,
                    },
                });

                if (!response.data) {
                    throw new Error("No data received from API.");
                }

                const data = Array.isArray(response.data?.data)
                    ? response.data.data
                    : Array.isArray(response.data)
                        ? response.data
                        : [];

                setPurchaseData(data);

                // ✅ Set auto-generated purchase number to form
                if (response.data.purchaseNo) {
                    setPurchaseForm((prev) => ({
                        ...prev,
                        purchase_no: response.data.purchaseNo,
                    }));
                }

                setPagination({
                    currentPage: response.data.pagination?.current_page || 1,
                    lastPage: response.data.pagination?.last_page || 1,
                    total: response.data.pagination?.total || data.length || 0,
                    from: response.data.pagination?.from || 1,
                    to: response.data.pagination?.to || data.length || 0,
                });
            } catch (error) {
                handleApiError(error, "Failed to fetch purchase data.");
                setPurchaseData([]);
            } finally {
                setPageLoading(false);
            }
        },
        [perPage]
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPurchaseForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSelectChange = (name, selectedOption) => {
        setPurchaseForm((prev) => ({
            ...prev,
            [name]: selectedOption ? selectedOption.value : "",
        }));
    };

    const handlePageChange = (page) => {
        if (
            page > 0 &&
            page <= pagination.lastPage &&
            page !== pagination.currentPage
        ) {
            fetchPurchaseData(page, searchText, selectedSupplierId, startDate, endDate, perPage);
        }
    };

    const validateForm = () => {
        const {
            purchase_no,
            supplier_id,
            purchase_date,
            invoice_no,
            invoice_date,
        } = purchaseForm;

        if (
            !purchase_no ||
            !supplier_id ||
            !purchase_date ||
            !invoice_no ||
            !invoice_date ||
            !payment_status
        ) {
            toast.warning("Please fill in all required fields.");
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            // ✅ Choose API endpoint based on edit/create mode
            const url = editingPurchaseId
                ? `/api/update-purchase-order-data/${editingPurchaseId}`
                : "/api/store-purchase-order-data";

            // ✅ Send data to backend
            await api.post(url, purchaseForm);

            toast.success(
                `Purchase order ${editingPurchaseId ? "updated" : "added"} successfully!`
            );

            // ✅ Refresh the purchase order table with current filters
            await fetchPurchaseData(
                pagination.currentPage,
                selectedSupplierId,
                startDate,
                endDate,
                selectedPaymentStatus,
                perPage
            );

            // ✅ Close modal and reset form after success
            setShowModal(false);
            resetForm();
        } catch (error) {
            const status = error.response?.status;

            if (status === 409) {
                handleApiError(error, "This purchase order number already exists.");
            } else if (status === 422) {
                handleApiError(error, "Please fix the validation errors.");
            } else {
                handleApiError(error, "An unexpected error occurred.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };


    const editPurchase = async (purchaseId) => {
        try {
            const response = await api.get(`/api/get-purchase-order-data/${purchaseId}`);
            const purchase = response.data?.data?.purchase;

            if (purchase) {
                setPurchaseForm({
                    supplier_id: purchase.supplier_id || "",
                    agent_id: purchase.agent_id || "",
                    challan_no: purchase.challan_no || "",
                    challan_date: purchase.challan_date || "",
                    invoice_no: purchase.invoice_no || "",
                    invoice_date: purchase.invoice_date || "",
                    notes: purchase.notes || "",
                    fabric_id: purchase.fabric_id || "",
                    lot_no: purchase.lot_no || "",
                    hsn_code: purchase.hsn_code || "",
                    taka_no: purchase.taka_no || "",
                });

                setEditingPurchaseId(purchaseId);
                setShowModal(true);
            } else {
                toast.error("Purchase order data not found.");
            }
        } catch (error) {
            handleApiError(error, "Error fetching purchase order data.");
        }
    };

    const deletePurchase = async (purchaseId) => {
        if (!window.confirm("Are you sure you want to delete this purchase order?"))
            return;

        try {
            const response = await api.delete(`/api/delete-purchase-order/${purchaseId}`);
            if (response.status === 200) {
                toast.success("Purchase order deleted successfully!");
                fetchPurchaseData(pagination.currentPage, searchText, selectedSupplierId, startDate, endDate, perPage);
            } else {
                toast.error("Failed to delete purchase order.");
            }
        } catch (error) {
            handleApiError(error, "Something went wrong!");
        }
    };

    const debouncedFetchPurchaseData = useMemo(
        () =>
            debounce((page, search, supplier, start, end, perPageCount) => {
                fetchPurchaseData(page, search, supplier, start, end, perPageCount);
            }, 500),
        [fetchPurchaseData]
    );



    const applyFilters = () => {
        fetchPurchaseData(1, selectedSupplierId, startDate, endDate, perPage);
    };

    const resetFilters = () => {
        setSelectedSupplierId("");
        setStartDate("");
        setEndDate("");
        setSelectedPaymentStatus("");

        // ✅ Correct argument order
        fetchPurchaseData();
    };




    const handleClose = () => {
        setShowModal(false);
        resetForm();
    };

    const resetForm = () => {
        setPurchaseForm({
            purchase_id: "",
            supplier_id: "",
            purchase_no: "",
            purchase_date: "",
            invoice_no: "",
            invoice_date: "",
            payment_type: "",
            total_before_tax: "",
            total_gst: "",
            total_amount: "",
            discount_amount: "",
            net_total: "",
            payment_status: "",
            remarks: "",
        });
        setEditingPurchaseId(null);
    };

    const startIndex = (pagination.currentPage - 1) * perPage;
    const handleDeleteLot = async (lotId) => {
        if (!window.confirm("Are you sure you want to delete this lot?")) return;

        try {
            await api.delete(`/api/purchase/lot/${lotId}`);

            toast.success("Lot deleted successfully!");

            // Remove the deleted lot from local state
            setLotDetails((prev) => prev.filter((lot) => lot.lots_id !== lotId));
            fetchPurchaseData();
        } catch (error) {
            console.error(error);
            toast.error("Error deleting lot.");
        }
    };
    const [editingLotId, setEditingLotId] = useState(null);
    const [editMeterValue, setEditMeterValue] = useState("");

    const handleUpdateMeter = async (lotId) => {
        if (editMeterValue === "") return;

        try {
            await api.put(`/api/purchase/lot/${lotId}`, { meter: parseFloat(editMeterValue) });
            toast.success("Meter updated successfully!");

            setLotDetails((prev) =>
                prev.map((lot) =>
                    lot.lots_id === lotId ? { ...lot, meter: parseFloat(editMeterValue) } : lot
                )
            );
            // ✅ Refresh purchase table
            fetchPurchaseData();

        } catch (error) {
            console.error(error);
            toast.error("Error updating meter.");
        } finally {
            setEditingLotId(null);
            setEditMeterValue("");
        }
    };






    return (
        <>
            <Helmet>
                <title>ERP | Challan Manage</title>
            </Helmet>
            <div className="card">
                <h5 className="card-header d-flex justify-content-between align-items-center flex-wrap">
                    <span>Purchase Orders</span>
                    <div className="btn-group mt-2 mt-md-0">
                        <div className="dropdown">
                            <button
                                type="button"
                                className="btn ms-1 btn-primary rounded-pill"
                                data-bs-toggle="dropdown"
                            >
                                <i className="bx bx-plus-circle me-2"></i> Create
                            </button>
                            <div className="dropdown-menu">
                                {/* ✅ New Add Item Button */}
                                <button
                                    className="dropdown-item me-2"
                                    onClick={() => navigate(`/create-challan-bill`)}
                                >
                                    <i className="bx bx-plus-circle"></i> Create Challan
                                </button>
                                <button
                                    className="dropdown-item me-2"
                                    onClick={() => navigate(`/create-challan-invoice`)}
                                >
                                    <i className="bx bx-plus-circle"></i> Create Invoice
                                </button>

                                <button
                                    className="dropdown-item me-2"
                                    onClick={() => navigate(`/create-challan-invoice`)}
                                >
                                    <i className="bx bx-plus-circle"></i> Create Challan With Invoice
                                </button>

                            </div>
                        </div>

                        {/* <button
              aria-label="Add Purchase Order"
              className="btn btn-primary btn-sm"
              onClick={() => setShowModal(true)}
            >
              <i className="bx bx-plus-circle me-1"></i> Add Purchase Order
            </button> */}
                        {/* <button
              className="btn ms-1 btn-primary rounded-pill"
              onClick={() => navigate(`/create-purchase-order-bill`)}
            >
              <i className="bx bx-plus-circle me-1"></i> Create a bill
            </button> */}
                    </div>
                </h5>
                <div className="col-md-12 mb-4">
                    <Card className="shadow-sm border-0">
                        {/* Tabs Header */}
                        <div className="card-body border-bottom pb-0">
                            <ul
                                className="nav nav-tabs justify-content-center mb-3 border-0 flex-wrap"
                                style={{ gap: "1rem" }}
                            >
                                {/* Challan Tab */}
                                <li className="nav-item">
                                    <NavLink
                                        to="/purchase/purchase-challan-bill"
                                        className={({ isActive }) =>
                                            `nav-link fw-semibold px-4 py-2 rounded-pill ${isActive
                                                ? "active bg-primary text-white shadow-sm"
                                                : "text-primary border border-primary bg-transparent"
                                            }`
                                        }
                                    >
                                        <i className="bx bx-file me-1"></i> Challan
                                    </NavLink>
                                </li>

                                {/* Invoice Tab */}
                                <li className="nav-item">
                                    <NavLink
                                        to="/purchase/purchase-invoice-bill"
                                        className={({ isActive }) =>
                                            `nav-link fw-semibold px-4 py-2 rounded-pill ${isActive
                                                ? "active bg-primary text-white shadow-sm"
                                                : "text-primary border border-primary bg-transparent"
                                            }`
                                        }
                                    >
                                        <i className="bx bx-file me-1"></i> Invoice
                                    </NavLink>
                                </li>
                            </ul>
                        </div>
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <div
                                className="d-flex flex-wrap align-items-center gap-2 p-3 mb-3 bg-white rounded-3 shadow-sm"
                                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                            >
                                {/* Search Input */}


                                {/* Supplier Dropdown with Search */}
                                <div style={{ minWidth: "250px" }}>
                                    <Select
                                        classNamePrefix="react-select"
                                        name="supplier_id"
                                        placeholder="Search Supplier..."
                                        options={supplierFilterOptions}
                                        value={supplierFilterOptions.find((s) => s.value === selectedSupplierId) || null}
                                        onChange={(selected) => {
                                            const supplierValue = selected?.value || "";
                                            setSelectedSupplierId(supplierValue);
                                            fetchPurchaseData(1, supplierValue, startDate, endDate); // ✅ refresh table
                                        }}
                                        isClearable
                                        isSearchable
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                minHeight: "32px",
                                                fontSize: "14px",
                                                boxShadow: "none",
                                            }),
                                        }}
                                    />
                                </div>

                                <div style={{ minWidth: "250px" }}>
                                    <Select
                                        classNamePrefix="react-select"
                                        name="supplier_id"
                                        placeholder="Product Type..."
                                        options={supplierFilterOptions}
                                        value={supplierFilterOptions.find((s) => s.value === selectedSupplierId) || null}
                                        onChange={(selected) => {
                                            const supplierValue = selected?.value || "";
                                            setSelectedSupplierId(supplierValue);
                                            fetchPurchaseData(1, supplierValue, startDate, endDate); // ✅ refresh table
                                        }}
                                        isClearable
                                        isSearchable
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                minHeight: "32px",
                                                fontSize: "14px",
                                                boxShadow: "none",
                                            }),
                                        }}
                                    />
                                </div>




                                {/* Date Range Filter */}
                                <div className="d-flex align-items-center gap-2">
                                    <input
                                        type="date"
                                        className="form-control form-control"
                                        name="start_date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        aria-label="Start Date"
                                    />
                                    <span className="fw-semibold">to</span>
                                    <input
                                        type="date"
                                        className="form-control form-control"
                                        name="end_date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        aria-label="End Date"
                                    />
                                </div>




                                {/* Filter Button */}
                                <button
                                    className="btn btn-sm btn-primary fw-semibold"
                                    onClick={applyFilters}
                                >
                                    <i className="bx bx-search me-1"></i> Search
                                </button>

                                {/* Reset Button */}
                                <button
                                    className="btn btn-sm btn-outline-secondary fw-semibold"
                                    onClick={resetFilters}
                                >
                                    <i className="bx bx-refresh me-1"></i> Reset
                                </button>

                            </div>

                        </div>
                        <div className="table-responsive text-nowrap fs-6">
                            {loading ? (
                                <Spinner message="Loading..." />
                            ) : purchaseData.length > 0 ? (
                                <>
                                    <table className="table table-hover text-nowrap">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="text-center">Sr.</th>
                                                <th>Vendor</th>
                                                <th>Product Name</th>
                                                <th>Type</th>
                                                <th>Lot No</th>
                                                <th>Invoice No</th>
                                                <th>Invoice Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pageLoading ? (
                                                <tr>
                                                    <td colSpan="9" className="text-center p-5">
                                                        <Spinner message="Loading..." />
                                                    </td>
                                                </tr>
                                            ) : purchaseData.length > 0 ? (
                                                purchaseData.map((purchase, index) => (
                                                    <tr key={purchase?.purchase_id || index}>
                                                        <td className="text-center">{startIndex + index + 1}</td>
                                                        <td>{purchase?.supplier_name || "N/A"}</td>
                                                        <td>{purchase?.fabric_name || "N/A"}</td>
                                                        <td>{purchase?.fabric_name || "N/A"}</td>
                                                        <td
                                                            className="fw-semibold text-primary"
                                                            style={{ cursor: "pointer" }}
                                                            onClick={() => handleViewLots(purchase.purchase_id)}
                                                        >
                                                            {purchase?.lot_no || "N/A"}
                                                        </td>
                                                        <td>{purchase?.invoice_no || "N/A"}</td>
                                                        <td>
                                                            {purchase?.challan_date
                                                                ? new Date(purchase.invoice_date)
                                                                    .toLocaleDateString("en-GB")
                                                                    .replace(/\//g, "-")
                                                                : "N/A"}
                                                        </td>
                                                        <td>
                                                            <div className="dropdown">
                                                                <button
                                                                    type="button"
                                                                    className="btn ms-2 btn-sm btn-primary rounded-pill"
                                                                    data-bs-toggle="dropdown"
                                                                >
                                                                    <i className="bx bx-down-arrow-circle"></i>
                                                                </button>
                                                                <div className="dropdown-menu">
                                                                    {/* ✅ New Add Item Button */}
                                                                    <button
                                                                        className="dropdown-item me-2"
                                                                        onClick={() => navigate(`/add-purchase-item/${purchase.purchase_id}`)}
                                                                    >
                                                                        <i className="bx bx-plus-circle"></i> Add Item
                                                                    </button>
                                                                    <button
                                                                        className="dropdown-item me-2"
                                                                        onClick={() => editPurchase(purchase.purchase_id)}
                                                                    >
                                                                        <i className="bx bx-edit"></i> Edit
                                                                    </button>
                                                                    <button
                                                                        className="dropdown-item me-2"
                                                                        onClick={() => deletePurchase(purchase.purchase_id)}
                                                                    >
                                                                        <i className="bx bx-trash"></i> Delete
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="9" className="text-center">
                                                        No records found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                    <hr className="mt-0 mb-0 shadow-sm" />
                                    {pagination.total > 0 && (
                                        <div className="d-flex justify-content-between align-items-center gap-2 mb-1 pt-3 mx-2">
                                            <div className="d-flex align-items-center gap-2">
                                                <label htmlFor="perPageSelect" className="mb-0 fw-semibold">
                                                    Show
                                                </label>
                                                <select
                                                    id="perPageSelect"
                                                    className="form-select form-select-sm fw-bold"
                                                    style={{ width: "80px" }}
                                                    value={perPage}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value);
                                                        setPerPage(value);
                                                        fetchPurchaseData(1, searchText, selectedSupplierId, startDate, endDate, value);
                                                        setPagination((prev) => ({ ...prev, currentPage: 1 }));
                                                    }}
                                                >
                                                    <option value="25">25</option>
                                                    <option value="50">50</option>
                                                    <option value="75">75</option>
                                                    <option value="100">100</option>
                                                </select>
                                            </div>
                                            <div className="d-flex align-items-center gap-3">
                                                <span className="fw-semibold">
                                                    {pagination.from} - {pagination.to} of {pagination.total}
                                                </span>
                                                <div className="btn-group">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() =>
                                                            handlePageChange(pagination.currentPage - 1)
                                                        }
                                                        disabled={pagination.currentPage === 1}
                                                        aria-label="Previous Page"
                                                    >
                                                        <i className="bx bx-chevron-left" />
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() =>
                                                            handlePageChange(pagination.currentPage + 1)
                                                        }
                                                        disabled={pagination.currentPage === pagination.lastPage}
                                                        aria-label="Next Page"
                                                    >
                                                        <i className="bx bx-chevron-right" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center p-5">No records found</div>
                            )}
                        </div>
                    </Card>
                </div>


            </div>
            <Modal
                show={showModal}
                onHide={handleClose}
                aria-labelledby="purchaseModalTitle"
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title id="purchaseModalTitle">
                        {editingPurchaseId
                            ? "Update Purchase Order"
                            : "Create Purchase Order"}
                    </Modal.Title>
                </Modal.Header>
                <hr className="mt-0 mb-0 shadow-sm" />
                <Modal.Body>
                    <div className="row g-2">
                        <div className="col-md-4 mb-1">
                            <label className="form-label">Select Supplier</label>
                            <Select
                                options={purchaseOptions}
                                name="supplier_id"
                                value={purchaseOptions.find(
                                    (option) => option.value === purchaseForm.supplier_id
                                )}
                                onChange={(option) => handleSelectChange("supplier_id", option)}
                                placeholder="Select Supplier"
                                isClearable
                                isDisabled={isSubmitting}
                            />
                        </div>
                        <div className="col-md-4 mb-1">
                            <label className="form-label">Purchase No</label>
                            <input
                                type="text"
                                name="purchase_no"
                                value={purchaseForm.purchase_no}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="Enter Purchase No"
                                required
                                readOnly
                                disabled={isSubmitting}
                                style={{
                                    backgroundColor: "#f9f9f9",
                                    fontWeight: "600", // Ensures bold
                                    color: "#000", // Dark text
                                }}
                            />
                        </div>
                        <div className="col-md-4 mb-1">
                            <label className="form-label">Purchase Date</label>
                            <input
                                type="date"
                                name="purchase_date"
                                value={purchaseForm.purchase_date}
                                onChange={handleChange}
                                className="form-control"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="col-md-4 mb-1">
                            <label className="form-label">Invoice No</label>
                            <input
                                type="text"
                                name="invoice_no"
                                value={purchaseForm.invoice_no}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="Enter Invoice No"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="col-md-4 mb-1">
                            <label className="form-label">Invoice Date</label>
                            <input
                                type="date"
                                name="invoice_date"
                                value={purchaseForm.invoice_date}
                                onChange={handleChange}
                                className="form-control"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="col-md-4 mb-1">
                            <label className="form-label">Payment Type</label>
                            <Select
                                name="payment_type"
                                options={paymentOptions}
                                value={paymentOptions.find(
                                    (option) => option.value === purchaseForm.payment_type
                                )}
                                onChange={(option) => handleSelectChange("payment_type", option)}
                                isDisabled={isSubmitting}
                                isClearable
                                placeholder="Select Payment Type..."
                                classNamePrefix="react-select"
                            />
                        </div>
                        <div className="col-md-4 mb-1">
                            <label className="form-label">Total Before Tax</label>
                            <input
                                type="number"
                                name="total_before_tax"
                                value={purchaseForm.total_before_tax}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="0.00"
                                required
                                disabled={isSubmitting}
                                step="0.01"
                            />
                        </div>
                        <div className="col-md-4 mb-1">
                            <label className="form-label">GST Amount</label>
                            <input
                                type="number"
                                name="total_gst"
                                value={purchaseForm.total_gst}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="0.00"
                                required
                                disabled={isSubmitting}
                                step="0.01"
                            />
                        </div>
                        <div className="col-md-4 mb-1">
                            <label className="form-label">Total Amount</label>
                            <input
                                type="number"
                                name="total_amount"
                                value={purchaseForm.total_amount}
                                className="form-control"
                                placeholder="0.00"
                                readOnly
                                disabled={isSubmitting}
                                step="0.01"
                            />
                        </div>
                        <div className="col-md-4 mb-1">
                            <label className="form-label">Discount Amount</label>
                            <input
                                type="number"
                                name="discount_amount"
                                value={purchaseForm.discount_amount}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="0.00"
                                disabled={isSubmitting}
                                step="0.01"
                            />
                        </div>
                        <div className="col-md-4 mb-1">
                            <label className="form-label">Net Amount</label>
                            <input
                                type="number"
                                name="net_total"
                                value={purchaseForm.net_total}
                                className="form-control"
                                placeholder="0.00"
                                readOnly
                                disabled={isSubmitting}
                                step="0.01"
                            />
                        </div>
                        <div className="col-md-4 mb-1">
                            <label className="form-label">Payment Status</label>
                            <Select
                                name="payment_status"
                                options={paymentStatusOptions}
                                value={paymentStatusOptions.find(
                                    (option) => option.value === purchaseForm.payment_status
                                )}
                                onChange={(option) => handleSelectChange("payment_status", option)}
                                isDisabled={isSubmitting}
                                isClearable
                                placeholder="Select Payment Status..."
                                classNamePrefix="react-select"
                            />
                        </div>
                        <div className="col-md-12 mb-1">
                            <label className="form-label">Remarks</label>
                            <textarea
                                name="remarks"
                                value={purchaseForm.remarks}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="Enter Remarks"
                                rows="2"
                                disabled={isSubmitting}
                            ></textarea>
                        </div>
                    </div>
                </Modal.Body>
                <hr className="mt-0 mb-0 shadow-sm" />
                <Modal.Footer>
                    <Button variant="outline-secondary" size="sm" onClick={handleClose}>
                        <i className="bx bx-window-close"></i> Close
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        aria-label={editingPurchaseId ? "Update Purchase" : "Save Purchase"}
                    >
                        {isSubmitting ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-1"
                                    role="status"
                                    aria-hidden="true"
                                ></span>
                                Please wait...
                            </>
                        ) : (
                            <>
                                <i className="bx bx-book-add"></i>{" "}
                                {editingPurchaseId ? "Update Purchase" : "Save Purchase"}
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>


            <Modal show={showLotModal} onHide={() => setShowLotModal(false)} centered size="lg">
                <Modal.Header closeButton className="d-flex justify-content-between align-items-center">
                    <Modal.Title>Lot Details</Modal.Title>
                    <Button
                        variant="primary"
                        size="sm"
                        className="rounded-pill"
                        onClick={async () => {
                            if (!editingPurchaseId) return;

                            // 1️⃣ Generate new lot number
                            const baseLotNo =
                                lotDetails[0]?.lot_no?.split('-').slice(0, 2).join('-') || 'LOT-0001';
                            const existingCount = lotDetails.filter(l => l.lot_no.startsWith(baseLotNo)).length;
                            const newLotNo = `${baseLotNo}-${existingCount + 1}`;

                            // 2️⃣ Create temporary frontend lot
                            const tempLot = {
                                lots_id: Date.now(), // temp ID
                                lot_no: newLotNo,
                                meter: 0,
                                purchase_id: editingPurchaseId,
                            };

                            // 3️⃣ Add to frontend state and open edit mode
                            setLotDetails(prev => [...prev, tempLot]);
                            setEditingLotId(tempLot.lots_id);
                            setEditMeterValue(tempLot.meter);

                            // 4️⃣ Auto-save to backend
                            try {
                                const response = await api.post(`/api/purchase/${editingPurchaseId}/add-lot`, {
                                    lot_no: newLotNo,
                                    meter: 0,
                                });

                                const savedLot = response.data.data;

                                // 5️⃣ Replace temporary ID with backend lots_id
                                setLotDetails(prev =>
                                    prev.map(lot =>
                                        lot.lots_id === tempLot.lots_id ? { ...savedLot } : lot
                                    )
                                );

                                toast.success("New lot added successfully!");
                            } catch (error) {
                                handleApiError(error, "Failed to add new lot automatically.");
                            }
                        }}
                    >
                        <i className="bx bx-plus me-1"></i> Add Lot
                    </Button>
                </Modal.Header>
                {/* Add Lot button at top-right */}
                <hr className="mt-0 mb-0 shadow-sm" />
                <Modal.Body>

                    <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
                        <table className="table table-bordered  text-left align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Sr</th>
                                    <th>Lot No</th>
                                    <th>Meter</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lotDetails.map((lot, index) => (
                                    <tr key={lot.lots_id}>
                                        <td className="text-center">{index + 1}</td>
                                        <td className="fw-semibold">{lot.lot_no}</td>

                                        {/* Editable meter cell */}
                                        <td
                                            onClick={() => {
                                                setEditingLotId(lot.lots_id);
                                                setEditMeterValue(lot.meter);
                                            }}
                                            style={{ cursor: "pointer", width: "150px" }}
                                        >
                                            {editingLotId === lot.lots_id ? (
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={editMeterValue}
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => setEditMeterValue(e.target.value)}
                                                    onBlur={() => handleUpdateMeter(lot.lots_id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleUpdateMeter(lot.lots_id);
                                                    }}
                                                />
                                            ) : (
                                                parseFloat(lot.meter).toFixed(2)
                                            )}
                                        </td>

                                        <td className="text-center">
                                            <button
                                                className="btn btn-sm btn-danger rounded-pill"
                                                onClick={() => handleDeleteLot(lot.lots_id)}
                                            >
                                                <i className="bx bx-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
                <hr className="mt-0 mb-0 shadow-sm" />
                <Modal.Footer className="d-flex justify-content-between align-items-center">
                    <div className="fw-bold fs-5">
                        Total Meter :- {" "}
                        {lotDetails.reduce((sum, item) => sum + (parseFloat(item.meter) || 0), 0).toFixed(2)}
                    </div>

                    <div>
                        <Button variant="secondary" onClick={() => setShowLotModal(false)} className="rounded-pill">
                            Close
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>





        </>
    );
};

export default ChallanInvoicePage;