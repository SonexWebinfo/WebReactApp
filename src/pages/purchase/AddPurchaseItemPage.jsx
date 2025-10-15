import { useParams } from "react-router-dom";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { api } from "../../services/api";
import { Helmet } from "react-helmet-async";
import { debounce } from "lodash";
import { Modal, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Select from "react-select";

const Spinner = ({ message = "Loading..." }) => (
    <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{message}</span>
        </div>
    </div>
);

const AddPurchaseItemPage = () => {
    const { purchase_id } = useParams(); // Unused in provided code; kept for potential future use
    const navigate = useNavigate();

    const [showModal, setShowModal] = useState(false);
    const [editingPurchaseId, setEditingPurchaseId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pageLoading, setPageLoading] = useState(false);
    const [purchaseData, setPurchaseData] = useState([]);
    const [fabricOptions, setFabricOptions] = useState([]);
    const [fabricTypeOptions, setFabricTypeOptions] = useState([]);
    const [fabricColorOptions, setFabricColorOptions] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [perPage, setPerPage] = useState(25);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        from: 0,
        to: 0,
        total: 0,
    });

    const startIndex = (pagination.currentPage - 1) * perPage;

    const [purchaseForm, setPurchaseForm] = useState({
        purchase_id: "",       // 🔒 hidden field (purchase order id)
        fabric_name: "",
        fabric_type: "",
        color: "",
        gsm: "",
        width: "",
        quantity_mtr: "",
        rate_per_mtr: "",
        gst_percent: "",
        amount: 0,
        gst_amount: 0,
        total_amount: 0,
        lot_no: 0,
    });

    const [summary, setSummary] = useState({
        total_item: 0,
        total_qty: 0,
        amount: 0,
        gst_amount: 0,
        total_amount: 0,
    });


    // Fetch suppliers for dropdowns
    const initialFetch = useRef(true);

    useEffect(() => {
        if (initialFetch.current) {
            initialFetch.current = false;
            fetchInitialData();
            fetchFabricTypes(); // fetch fabric types
            fetchFabricColor(); // fetch fabric types

        }
    }, []);

    // ✅ Define the function BEFORE it's used
    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([fetchFabric()]);
        } catch (error) {
            handleApiError(error, "Failed to load initial data.");
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ Fabric fetch function
    const fetchFabric = useCallback(async () => {
        try {
            const response = await api.get("/api/get-fabric");

            if (response.data && Array.isArray(response.data)) {
                setFabricOptions(
                    response.data.map((fabric) => ({
                        value: fabric.id,
                        label: fabric.name,
                    }))
                );
            } else {
                toast.error("Failed to load Fabric.");
            }
        } catch (error) {
            handleApiError(error, "Error fetching Fabric.");
        }
    }, []);

    const fetchFabricTypes = useCallback(async () => {
        try {
            const res = await api.get("/api/get-fabric-types"); // your API endpoint
            if (res.data && Array.isArray(res.data)) {
                setFabricTypeOptions(
                    res.data.map(type => ({ value: type.id, label: type.name }))
                );
            } else {
                toast.error("Failed to load fabric types");
            }
        } catch (error) {
            handleApiError(error, "Error fetching Fabric.");
        }
    }, []);

    const fetchFabricColor = useCallback(async () => {
        try {
            const res = await api.get("/api/get-fabric-color"); // your API endpoint
            if (res.data && Array.isArray(res.data)) {
                setFabricColorOptions(
                    res.data.map(color => ({ value: color.id, label: color.name }))
                );
            } else {
                toast.error("Failed to load fabric color");
            }
        } catch (error) {
            handleApiError(error, "Error fetching Fabric Color.");
        }
    }, []);




    // Fetch purchase data
    // ✅ Fetch Purchase Items with purchase_id


    const fetchPurchaseItemData = useCallback(
        async (page = 1, perPage = 10, purchaseId) => {
            if (!purchaseId) {
                console.warn("purchaseId is required to fetch items.");
                setPurchaseData([]);
                return;
            }

            setLoading(true);
            try {
                const res = await api.get(`/api/add-purchase-item/${purchaseId}`, {
                    params: { page, perPage }
                });

                if (res.data?.data) {
                    setPurchaseData(res.data.data);
                    if (res.data.lotNo) {
                        setPurchaseForm((prev) => ({
                            ...prev,
                            lot_no: res.data.lotNo,
                        }));
                    }
                    setSummary(res.data.summary || {}); // ✅ summary set
                    setPagination({
                        currentPage: res.data.pagination?.current_page || 1,
                        lastPage: res.data.pagination?.last_page || 1,
                        from: res.data.pagination?.from || 0,
                        to: res.data.pagination?.to || 0,
                        total: res.data.pagination?.total || 0,
                    });
                } else {
                    setPurchaseData([]);
                    setSummary({});
                }
            } catch (err) {
                console.error("Fetch purchase items error:", err);
                toast.error("Failed to fetch purchase items");
                setPurchaseData([]);
            } finally {
                setLoading(false);
            }
        },
        []
    );






    // ✅ Trigger data load when component mounts or purchase_id changes
    useEffect(() => {
        if (purchase_id) {
            fetchPurchaseItemData(1, "", purchase_id);
        }
    }, [fetchPurchaseItemData, purchase_id]);


    // Debounced search handler
    const handleSearchChange = debounce((e) => {
        setSearchText(e.target.value);
    }, 300);

    // Apply filters
    const applyFilters = () => {
        fetchPurchaseItemData(1, searchText, selectedSupplierId, startDate, endDate, perPage, selectedPaymentStatus);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    // Reset filters
    const resetFilters = () => {
        setSearchText("");
        setSelectedSupplierId("");
        setSelectedPaymentStatus("");
        setStartDate("");
        setEndDate("");
        fetchPurchaseItemData(1, "", "", "", "", perPage, "");
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    // Page change
    const handlePageChange = (page) => {
        if (page < 1 || page > pagination.lastPage) return;
        fetchPurchaseItemData(page, searchText, selectedSupplierId, startDate, endDate, perPage, selectedPaymentStatus);
        setPagination((prev) => ({ ...prev, currentPage: page }));
    };

    // Modal close
    const handleClose = () => {
        setShowModal(false);
        resetForm();
    };

    const resetForm = () => {
        setPurchaseForm({
            purchase_id: "",
            fabric_name: "",
            fabric_type: "",
            color: "",
            gsm: "",
            width: "",
            quantity_mtr: "",
            rate_per_mtr: "",
            gst_percent: "",
            amount: 0,
            gst_amount: 0,
            total_amount: 0,
            lot_no: 0,
        });
        setEditingPurchaseId(null);
    };



    // Select change
    const handleSelectChange = (name, option) => {
        setPurchaseForm((prev) => ({ ...prev, [name]: option ? option.value : "" }));
    };

    // Centralized error handling
    const handleApiError = (error, defaultMessage) => {
        console.error("API Error:", error);
        toast.error(error.response?.data?.message || defaultMessage);
    };

    // Form submit
    const validateForm = () => {
        const requiredFields = [
            "purchase_id",
            "fabric_name",
            "quantity_mtr",
            "rate_per_mtr",
            "gst_percent",
        ];

        for (const field of requiredFields) {
            const value = purchaseForm?.[field];

            // Check undefined, null, empty string, or 0 (for IDs)
            if (value === undefined || value === null || value === "") {
                toast.warning(`Please enter ${field.replace("_", " ")}.`);
                return false;
            }
        }

        return true;
    };


    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const url = editingPurchaseId
                ? `/api/update-purchase-items/${editingPurchaseId}`
                : "/api/store-purchase-items";

            // ✅ Send data to backend
            const response = await api.post(url, purchaseForm);

            toast.success(
                `Purchase order item ${editingPurchaseId ? "updated" : "added"} successfully!`
            );

            // ✅ Immediately refresh table data
            // Pass correct purchase_id from form
            await fetchPurchaseItemData(
                pagination.currentPage || 1,
                searchText || "",
                purchaseForm.purchase_id
            );

            // ✅ Close modal and reset form
            handleClose();

        } catch (error) {
            const status = error.response?.status;

            if (status === 409) {
                handleApiError(error, "This purchase item already exists.");
            } else if (status === 422) {
                handleApiError(error, "Please fix the validation errors.");
            } else {
                console.error("Unexpected error:", error);
                handleApiError(error, "An unexpected error occurred.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };




    // Edit purchase


    const editPurchaseItem = async (itemId) => {
        try {
            const response = await api.get(`/api/get-purchase-item/${itemId}`); // 🔹 API: single item fetch
            const item = response.data?.data;

            if (item) {
                setPurchaseForm({
                    item_id: item.item_id || "",
                    purchase_id: item.purchase_id || "",
                    fabric_name: item.fabric_name || "",
                    fabric_types_name: item.fabric_type || "",
                    color_name: item.color || "",
                    gsm: item.gsm || "",
                    width: item.width || "",
                    quantity_mtr: item.quantity_mtr || "",
                    rate_per_mtr: item.rate_per_mtr || "",
                    amount: item.amount || "",
                    gst_percent: item.gst_percent || "",
                    gst_amount: item.gst_amount || "",
                    total_amount: item.total_amount || "",
                    lot_no: item.lot_no || "",
                });

                setEditingPurchaseId(itemId);
                setShowModal(true); // 🔑 open modal with item data
            } else {
                toast.error("Purchase item not found.");
            }
        } catch (error) {
            handleApiError(error, "Error fetching purchase item data.");
        }
    };



    // Delete purchase
    const deletePurchaseItem = async (itemId, currentPurchaseId) => {
        if (!window.confirm("Are you sure you want to delete this purchase order item?")) return;

        try {
            const response = await api.delete(`/api/delete-purchase-item/${itemId}`);

            if (response.status === 200) {
                toast.success("Purchase order item deleted successfully!");

                // 🔄 Refresh current page after delete
                await fetchPurchaseItemData(
                    pagination.currentPage || 1,
                    searchText || "",
                    purchaseForm.purchase_id // ✅ pass correct purchase ID
                );

            } else {
                toast.error("Failed to delete purchase order item.");
            }
        } catch (error) {
            console.error("Delete error:", error);
            handleApiError(error, "Something went wrong!");
        }
    };



    const handleAddItemClick = (purchaseId) => {
        setPurchaseForm((prev) => ({
            ...prev,
            purchase_id: purchaseId, // ✅ hidden field
        }));
        setShowModal(true); // ✅ open modal
    };



    const handleChange = (e) => {
        const { name, value } = e.target;
        setPurchaseForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    useEffect(() => {
        const qty = parseFloat(purchaseForm.quantity_mtr) || 0;
        const rate = parseFloat(purchaseForm.rate_per_mtr) || 0;
        const gst = parseFloat(purchaseForm.gst_percent) || 0;
        const total = qty * rate;
        const gstAmount = total * (gst / 100);
        const totalAmount = total + gstAmount;

        setPurchaseForm((prev) => ({
            ...prev,
            amount: total.toFixed(2),
            gst_amount: gstAmount.toFixed(2),
            total_amount: totalAmount.toFixed(2),
        }));
    }, [purchaseForm.quantity_mtr, purchaseForm.rate_per_mtr, purchaseForm.gst_percent]);



    return (
        <>
            <Helmet>
                <title>ERP | Purchase Order</title>
            </Helmet>
            <div className="card">
                <h5 className="card-header d-flex justify-content-between align-items-center flex-wrap">
                    <span>Purchase Orders Items</span>
                    <div className="btn-group gap-2 mt-2 mt-md-0">
                        <button
                            aria-label="Add Items"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAddItemClick(purchase_id)}  // ✅ pass purchase_id
                        >
                            <i className="bx bx-plus-circle me-1"></i> Add Items
                        </button>

                        <button
                            className="btn btn-primary btn-sm me-2"
                            onClick={() => navigate(-1)} // Go to previous page
                            aria-label="Go Back"
                        >
                            <i className="bx bx-arrow-back me-1"></i> Back
                        </button>
                    </div>
                </h5>
                <hr className="mt-0 mb-0 shadow-sm" />
                <div className="row card-header mb-0">
                    <div className="col-md-6 col-xl-12">
                        <div className="card shadow-sm bg-light border border-0 mb-2">
                            <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <div>
                                    <h6 className="fw-bold mb-1 text-dark">Total Items</h6>
                                    <p className="mb-0 fs-5 text-center">{summary.total_item || 0}</p>
                                </div>
                                <div>
                                    <h6 className="fw-bold mb-1 text-dark">Total Qty (mtr)</h6>
                                    <p className="mb-0 fs-5 fw-bold text-center">
                                        {Number(summary.total_qty || 0).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}</p>
                                </div>
                                <div>
                                    <h6 className="fw-bold mb-1 text-dark">Amount</h6>
                                    <p className="mb-0 fs-5  text-center">
                                        ₹{""}
                                        {Number(summary.amount?.toFixed(2) || 0).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <h6 className="fw-bold mb-1 text-dark">GST Amount</h6>
                                    <p className="mb-0 fs-5 text-center">
                                        ₹{""}
                                        {Number(summary.gst_amount?.toFixed(2) || 0).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <h6 className="fw-bold mb-1 text-dark">Total Amount</h6>
                                    <p className="mb-0 fs-5 fw-bold text-center">
                                        ₹{""}
                                        {Number(summary.total_amount?.toFixed(2) || 0).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
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
                                        <th>Fabric</th>
                                        <th>Lot No</th>
                                        <th>GSM</th>
                                        <th>Qty (Mtr)</th>
                                        <th>Rate (₹)</th>
                                        <th>Total Amt (₹)</th>
                                        <th>Gst (%)</th>
                                        <th>Gst Amt (₹)</th>
                                        <th>With Gst Amt (₹)</th>
                                        <th className="text-center">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {pageLoading ? (
                                        <tr>
                                            <td colSpan="10" className="text-center p-5">
                                                <Spinner message="Loading..." />
                                            </td>
                                        </tr>
                                    ) : purchaseData.length > 0 ? (
                                        purchaseData.map((item, index) => (
                                            <tr key={item?.item_id || index}>
                                                <td className="text-center">{startIndex + index + 1}</td>
                                                <td className="fw-semibold">{item?.fabric_name || "N/A"}</td>
                                                <td>{item?.lot_no || "N/A"}</td>
                                                <td>{item?.gsm || "N/A"}</td>
                                                <td className="text-end">{item?.quantity_mtr || 0}</td>

                                                <td className="text-end">
                                                    ₹{""}
                                                    {Number(item?.rate_per_mtr || 0).toLocaleString("en-IN", {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>

                                                <td className="text-end">
                                                    ₹{""}
                                                    {Number(item?.amount || 0).toLocaleString("en-IN", {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                                <td className="text-center">{item?.gst_percent || 0}</td>
                                                <td className="text-end">
                                                    ₹{""}
                                                    {Number(item?.gst_amount || 0).toLocaleString("en-IN", {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>

                                                <td className="fw-semibold text-dark text-end">
                                                    ₹{""}
                                                    {Number(item?.total_amount || 0).toLocaleString("en-IN", {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>

                                                <td className="text-center">
                                                    <div className="dropdown">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-primary"
                                                            data-bs-toggle="dropdown"
                                                        >
                                                            <i className="bx bx-down-arrow-circle"></i>
                                                        </button>
                                                        <div className="dropdown-menu">
                                                            <button
                                                                className="dropdown-item"
                                                                onClick={() => editPurchaseItem(item.item_id)}
                                                            >
                                                                <i className="bx bx-edit"></i> Edit
                                                            </button>
                                                            <button
                                                                className="dropdown-item"
                                                                onClick={() => deletePurchaseItem(item.item_id)}
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
                                            <td colSpan="10" className="text-center">
                                                No purchase items found
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
                                                fetchPurchaseItemData(1, searchText, selectedSupplierId, startDate, endDate, value, selectedPaymentStatus);
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
            </div>
            <Modal
                show={showModal}
                onHide={handleClose}
                aria-labelledby="purchaseModalTitle"
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title id="purchaseModalTitle">
                        {editingPurchaseId
                            ? "Update Purchase Items Order"
                            : "Create Purchase Items Order"}
                    </Modal.Title>
                </Modal.Header>
                <hr className="mt-0 mb-0 shadow-sm" />
                <Modal.Body>
                    <div className="row g-2">
                        <div className="col-md-2 mb-1">
                            <label className="form-label">Fabric</label>
                            <Select
                                options={fabricOptions}
                                name="fabric_name"
                                value={fabricOptions.find(
                                    (option) => option.label === purchaseForm.fabric_name
                                ) || null} // handle null
                                onChange={(option) =>
                                    setPurchaseForm((prev) => ({
                                        ...prev,
                                        fabric_name: option?.label || "", // ✅ store only name
                                    }))
                                }
                                placeholder="Select Fabric"
                                isClearable
                                isDisabled={isSubmitting}
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
                        <div className="col-md-2 mb-1">
                            <label className="form-label">Fabric Type</label>
                            <Select
                                options={fabricTypeOptions}
                                name="fabric_types_name"
                                value={fabricTypeOptions.find(
                                    (option) => option.label === purchaseForm.fabric_types_name
                                ) || null}
                                onChange={(option) =>
                                    setPurchaseForm((prev) => ({
                                        ...prev,
                                        fabric_types_name: option?.label || "", // ✅ Always a string
                                    }))
                                }
                                placeholder="Select Fabric Type"
                                isClearable
                                isDisabled={isSubmitting}
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

                        <div className="col-md-2 mb-1">
                            <label className="form-label">Color</label>
                            <Select
                                options={fabricColorOptions}
                                name="color_name"
                                value={fabricColorOptions.find(
                                    option => option.label === purchaseForm.color_name
                                ) || null}
                                onChange={option =>
                                    setPurchaseForm(prev => ({ ...prev, color_name: option?.label || "" }))
                                }
                                placeholder="Select Color"
                                isClearable
                                isDisabled={isSubmitting}
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
                        <div className="col-md-2 mb-1">
                            <label className="form-label">GSM</label>
                            <input
                                type="text"
                                name="gsm"
                                value={purchaseForm.gsm}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="120 gsm"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="col-md-2 mb-1">
                            <label className="form-label">Width</label>
                            <input
                                type="text"
                                name="width"
                                value={purchaseForm.width}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="1.5 m"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="col-md-2 mb-1">
                            <label className="form-label">Lot No</label>
                            <input
                                type="text"
                                name="lot_no"
                                value={purchaseForm.lot_no}
                                onChange={handleChange}
                                className="form-control"
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
                        <div className="col-md-2 mb-1">
                            <label className="form-label">Qty(mtr)</label>
                            <input
                                type="text"
                                name="quantity_mtr"
                                value={purchaseForm.quantity_mtr}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="100 m"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="col-md-2 mb-1">
                            <label className="form-label">Rate</label>
                            <input
                                type="text"
                                name="rate_per_mtr"
                                value={purchaseForm.rate_per_mtr}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="0.00"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="col-md-2 mb-1">
                            <label className="form-label">Amount</label>
                            <input
                                type="text"
                                name="amount"
                                value={purchaseForm.amount}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="0.00"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="col-md-2 mb-1">
                            <label className="form-label">Gst(%)</label>
                            <input
                                type="text"
                                name="gst_percent"
                                value={purchaseForm.gst_percent}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="0%"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="col-md-2 mb-1">
                            <label className="form-label">Gst Amount</label>
                            <input
                                type="text"
                                name="gst_amount"
                                value={purchaseForm.gst_amount}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="0.00"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="col-md-2 mb-1">
                            <label className="form-label">Total Amount</label>
                            <input
                                type="text"
                                name="total_amount"
                                value={purchaseForm.total_amount}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="0.00"
                                disabled={isSubmitting}
                            />
                        </div>


                        {/* 🔒 Hidden Purchase ID Field */}
                        <input
                            type="hidden"
                            name="purchase_id"
                            value={purchaseForm.purchase_id}
                        />


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
                        aria-label={editingPurchaseId ? "Update Items" : "Save Items"}
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
                                <i className="bx bx-book-add me-1"></i>{" "}
                                {editingPurchaseId ? "Update Items" : "Save Items"}
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal >
        </>
    );
};

export default AddPurchaseItemPage;