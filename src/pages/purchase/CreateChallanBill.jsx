import React, { useEffect, useState, useCallback } from "react";
import { api } from "../../services/api";
import { Helmet } from "react-helmet-async";
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

// Default product type options
const defaultProductTypeOptions = [
    { value: "gray", label: "Gray" },
    { value: "rfd", label: "RFD" },
    { value: "coating", label: "Coating" },
];

export const CreateChallanBill = () => {
    const navigate = useNavigate();
    const [supplierOptions, setSupplierOptions] = useState([]);
    const [agentOptions, setAgentOptions] = useState([]);
    const [fabricOptions, setFabricOptions] = useState([]);
    const [productTypeOptions, setProductTypeOptions] = useState(defaultProductTypeOptions);
    const [editingPurchaseId, setEditingPurchaseId] = useState(null);
    const [showButton, setShowButton] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState([]);
    const [showItemsSection, setShowItemsSection] = useState(false); // Added missing state

    const [purchaseForm, setPurchaseForm] = useState({
        supplier_id: "",
        agent_id: "",
        challan_no: "",
        challan_date: new Date().toISOString().split("T")[0],
        notes: "",
        po_number: "", // Fixed: added missing field
        fabric_id: "",
        product_type: "",
        lot_no: "",
        hsn_code: "",
        challan_id: null, // Added for tracking
    });

    // Fixed: Initialize rows properly without full purchaseForm
    const [rows, setRows] = useState([{
        fabric_id: "",
        product_type: "",
        hsn_code: "",
        description: "",
        quantity_mtr: "",
        rate_per_mtr: "",
        gst_percent: "",
        amount: "",
        gstAmount: 0,
    }]);

    const addLine = useCallback(() => {
        setRows(prev => [...prev, {
            fabric_id: "",
            product_type: "",
            hsn_code: "",
            description: "",
            quantity_mtr: "",
            rate_per_mtr: "",
            gst_percent: "",
            amount: "",
            gstAmount: 0,
        }]);
    }, []);

    // Centralized error handler
    const handleApiError = (error, defaultMessage) => {
        console.error("API Error:", error);
        toast.error(error.response?.data?.message || defaultMessage);
    };

    // Fixed: Complete validation with return true
    const validateForm = () => {
        if (!purchaseForm.supplier_id) {
            toast.error("Please select a vendor.");
            return false;
        }
        if (!purchaseForm.challan_no) {
            toast.error("Please enter Challan No.");
            return false;
        }
        if (!purchaseForm.challan_date) {
            toast.error("Please select Challan Date.");
            return false;
        }
        return true; // Fixed: Added missing return
    };

    // Reset form
    const resetForm = () => {
        const today = new Date().toISOString().split("T")[0];
        setPurchaseForm({
            supplier_id: "",
            agent_id: "",
            challan_no: "",
            challan_date: today,
            notes: "",
            po_number: "",
            fabric_id: "",
            product_type: "",
            lot_no: "",
            hsn_code: "",
            challan_id: null,
        });
        setRows([{
            fabric_id: "",
            product_type: "",
            hsn_code: "",
            description: "",
            quantity_mtr: "",
            rate_per_mtr: "",
            gst_percent: "",
            amount: "",
            gstAmount: 0,
        }]);
        setEditingPurchaseId(null);
        setShowButton(false);
        setShowItemsSection(false);
        setModalData([]);
    };

    // Fetch initial data
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchSupplierOptions(),
                fetchAgentOptions(),
                fetchFabricOptions(),
                fetchProductTypeOptions(),
            ]);
        } catch (error) {
            handleApiError(error, "Failed to load initial data.");
        } finally {
            setLoading(false);
        }
    };

    const fetchProductTypeOptions = async () => {
        try {
            const response = await api.get("/api/get-product-types").catch(() => null);
            if (response?.data && Array.isArray(response.data)) {
                const options = response.data.map((type) => ({
                    value: type.value || type.id || type.name?.toLowerCase(),
                    label: type.label || type.name,
                })).filter(option => option.value && option.label);
                if (options.length > 0) {
                    setProductTypeOptions(options);
                } else {
                    setProductTypeOptions(defaultProductTypeOptions);
                }
            } else {
                setProductTypeOptions(defaultProductTypeOptions);
            }
        } catch (error) {
            console.warn("Using default product types:", error);
            setProductTypeOptions(defaultProductTypeOptions);
        }
    };

    const fetchSupplierOptions = async () => {
        try {
            const response = await api.get("/api/get-supplier");
            if (response.data && Array.isArray(response.data)) {
                setSupplierOptions(
                    response.data.map((supplier) => ({
                        value: supplier.id,
                        label: supplier.name,
                    })).filter(option => option.value && option.label)
                );
            }
        } catch (error) {
            handleApiError(error, "Error fetching suppliers.");
        }
    };

    const fetchAgentOptions = async () => {
        try {
            const response = await api.get("/api/get-agent");
            if (response.data && Array.isArray(response.data)) {
                setAgentOptions(
                    response.data.map((agent) => ({
                        value: agent.id,
                        label: agent.name,
                    })).filter(option => option.value && option.label)
                );
            }
        } catch (error) {
            handleApiError(error, "Error fetching agents.");
        }
    };

    const fetchFabricOptions = async () => {
        try {
            const response = await api.get("/api/get-fabric");
            if (response.data && Array.isArray(response.data)) {
                setFabricOptions(
                    response.data.map((fabric) => ({
                        value: fabric.id,
                        label: fabric.name,
                    })).filter(option => option.value && option.label)
                );
            }
        } catch (error) {
            handleApiError(error, "Error fetching fabrics.");
        }
    };

    // Fixed: Use api instead of axios
    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const response = await api.post("/api/store-challan", purchaseForm);
            if (response.data.success) {
                setPurchaseForm(prev => ({
                    ...prev,
                    challan_id: response.data.data.challan_id,
                }));
                setShowItemsSection(true);
                toast.success("Challan header saved successfully!");
            } else {
                toast.success(response.data.message);
            }
        } catch (error) {
            handleApiError(error, "Error saving challan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleItemsSubmit = async () => {
        if (rows.some(row => !row.fabric_id || !row.quantity_mtr || !row.rate_per_mtr)) {
            toast.error("Please fill all required fields in items.");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/api/challan/items', {
                challan_id: purchaseForm.challan_id,
                items: rows
            });
            toast.success("Challan saved successfully!");
            navigate(-1);
        } catch (error) {
            handleApiError(error, "Error saving challan items.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleModalSubmit = async () => {
        const invalidEntries = modalData.filter(item => !item.meter || parseFloat(item.meter) <= 0);
        if (invalidEntries.length > 0) {
            toast.error("Please enter valid meter value for all entries.");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post(`/api/purchase/${editingPurchaseId}/taka-details`, {
                purchase_id: editingPurchaseId,
                taka_details: modalData,
            });
            toast.success("Taka details saved successfully!");
            setShowModal(false);
            resetForm();
            navigate(-1);
        } catch (error) {
            handleApiError(error, "Error saving Taka details.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleModalInputChange = (index, field, value) => {
        setModalData((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    };

    // Fixed: Handle both main form and row selects
    const handleSelectChange = (name, selectedOption, index = null) => {
        if (index !== null) {
            // Update specific row
            setRows(prev => prev.map((row, i) =>
                i === index ? { ...row, [name]: selectedOption ? selectedOption.value : "" } : row
            ));
        } else {
            // Update main form
            setPurchaseForm((prev) => ({
                ...prev,
                [name]: selectedOption ? selectedOption.value : "",
            }));
            if (name === "fabric_id") {
                setShowButton(!!selectedOption);
            }
        }
    };

    // Main form input handler
    const handleMainFormChange = (e) => {
        const { name, value } = e.target;
        setPurchaseForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Row input handler
    const handleInputChange = (e, index) => {
        const { name, value } = e.target;
        setRows(prev => prev.map((row, i) =>
            i === index ? { ...row, [name]: value } : row
        ));
    };

    const removeLine = (index) => {
        setRows(prev => prev.filter((_, i) => i !== index));
    };

    // Fixed: Proper totals calculation with useCallback to prevent infinite loops
    const calculateTotals = useCallback((currentRows) => {
        const updatedRows = currentRows.map((row) => {
            const qty = parseFloat(row.quantity_mtr) || 0;
            const price = parseFloat(row.rate_per_mtr) || 0;
            const gst = parseFloat(row.gst_percent) || 0;
            const amount = qty * price;
            const gstAmount = (amount * gst) / 100;
            return { ...row, amount, gstAmount };
        });

        const subtotal = updatedRows.reduce((sum, r) => sum + r.amount, 0);
        const gstTotal = updatedRows.reduce((sum, r) => sum + r.gstAmount, 0);
        const grandTotal = subtotal + gstTotal;

        return { updatedRows, subtotal, gstTotal, grandTotal };
    }, []);

    const [totals, setTotals] = useState({
        subtotal: 0,
        gstTotal: 0,
        grandTotal: 0,
    });

    // Fixed: Proper useEffect for totals calculation
    useEffect(() => {
        const { updatedRows, subtotal, gstTotal, grandTotal } = calculateTotals(rows);
        setRows(updatedRows);
        setTotals({ subtotal, gstTotal, grandTotal });
    }, [rows, calculateTotals]);

    const formatCurrency = (num) =>
        num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Custom styles for react-select
    const customSelectStyles = {
        control: (provided) => ({
            ...provided,
            minHeight: '38px',
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 9999,
        }),
    };

    const findSelectedOption = (options, value) => {
        if (!options || !Array.isArray(options) || !value) return null;
        return options.find(option => option.value === value) || null;
    };

    // Show items section based on showItemsSection state instead of challan_id
    const showItems = showItemsSection && purchaseForm.challan_id;

    return (
        <>
            <Helmet>
                <title>ERP | Create Challan</title>
            </Helmet>

            <div className="card">
                <h5 className="card-header d-flex justify-content-between align-items-center flex-wrap">
                    <span>Challan Management</span>
                    <button
                        className="btn btn-primary rounded-pill btn-sm"
                        onClick={() => navigate(-1)}
                        aria-label="Go Back"
                    >
                        <i className="bx bx-left-arrow-circle me-1"></i> Back
                    </button>
                </h5>
                <hr className="mt-0 mb-0 shadow-sm" />
                <div className="row card-header mb-0">
                    <div className="col-md-12">
                        <div className="card-body">
                            {loading ? (
                                <Spinner message="Loading data..." />
                            ) : (
                                <div className="row g-2">
                                    {/* Vendor Select with Search */}
                                    <div className="col-md-3">
                                        <div className="mb-1">
                                            <label className="form-label fw-semibold">
                                                Vendor <span className="text-danger">*</span>
                                            </label>
                                            <Select
                                                options={supplierOptions}
                                                name="supplier_id"
                                                value={findSelectedOption(supplierOptions, purchaseForm.supplier_id)}
                                                onChange={(option) => handleSelectChange("supplier_id", option)}
                                                placeholder="Search and select vendor..."
                                                isSearchable
                                                isClearable
                                                styles={customSelectStyles}
                                                isDisabled={isSubmitting}
                                                isLoading={loading}
                                            />
                                        </div>
                                        <div className="mb-1">
                                            <label className="form-label fw-semibold">Agent</label>
                                            <Select
                                                options={agentOptions}
                                                name="agent_id"
                                                value={findSelectedOption(agentOptions, purchaseForm.agent_id)}
                                                onChange={(option) => handleSelectChange("agent_id", option)}
                                                placeholder="Search and select agent..."
                                                isSearchable
                                                isClearable
                                                styles={customSelectStyles}
                                                isDisabled={isSubmitting}
                                                isLoading={loading}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-1"></div>
                                    <div className="col-md-2">
                                        <div className="mb-1">
                                            <label className="form-label fw-semibold">
                                                Challan No <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="challan_no"
                                                value={purchaseForm.challan_no}
                                                onChange={handleMainFormChange}
                                                placeholder="Enter Challan No"
                                                disabled={isSubmitting}
                                                required
                                            />
                                        </div>
                                        <div className="mb-1">
                                            <label className="form-label fw-semibold">
                                                Challan Date <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="challan_date"
                                                value={purchaseForm.challan_date}
                                                onChange={handleMainFormChange}
                                                disabled={isSubmitting}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-1"></div>
                                    <div className="col-md-3">
                                        <div className="mb-1">
                                            <label className="form-label fw-semibold">PO/SO Number</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="po_number"
                                                value={purchaseForm.po_number || ""}
                                                onChange={handleMainFormChange}
                                                disabled={isSubmitting}
                                                placeholder="PO/SO Number"
                                            />
                                        </div>
                                        <div className="mb-1">
                                            <label className="form-label fw-semibold d-block">Notes</label>
                                            <div className="d-flex align-items-start gap-2">
                                                <textarea
                                                    className="form-control"
                                                    name="notes"
                                                    rows="1"
                                                    value={purchaseForm.notes || ""}
                                                    onChange={handleMainFormChange}
                                                    placeholder="Enter notes..."
                                                    disabled={isSubmitting}
                                                    style={{ resize: "vertical", minHeight: "38px" }}
                                                />
                                                <Button
                                                    variant="primary"
                                                    className="rounded-pill px-3 d-flex align-items-center"
                                                    onClick={handleSubmit}
                                                    disabled={isSubmitting}
                                                    style={{ whiteSpace: "nowrap", height: "38px" }}
                                                >
                                                    <i className="bx bx-save me-1"></i> Save
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items Section */}
                                    {showItems && (
                                        <div className="card shadow-sm border-1 mt-4">
                                            <div className="card-body p-3">
                                                <div className="row fw-semibold border-bottom pb-2 mb-3">
                                                    <div className="col-md-2">Select Product</div>
                                                    <div className="col-md-2">Product Type</div>
                                                    <div className="col-md-2">Description</div>
                                                    <div className="col-md-1 text-end">Qty(mtr)</div>
                                                    <div className="col-md-1 text-end">Price</div>
                                                    <div className="col-md-1">HSN</div>
                                                    <div className="col-md-1 text-end">GST (%)</div>
                                                    <div className="col-md-2 text-end">Amount</div>
                                                </div>

                                                {rows.map((row, index) => (
                                                    <div key={index} className="row g-1 align-items-center border-bottom pb-2 mb-1">
                                                        <div className="col-md-2">
                                                            <Select
                                                                options={fabricOptions}
                                                                value={findSelectedOption(fabricOptions, row.fabric_id)}
                                                                onChange={(option) => handleSelectChange("fabric_id", option, index)}
                                                                placeholder="Product"
                                                                isClearable
                                                                isDisabled={isSubmitting}
                                                                styles={customSelectStyles}
                                                            />
                                                        </div>
                                                        <div className="col-md-2">
                                                            <Select
                                                                options={productTypeOptions}
                                                                value={findSelectedOption(productTypeOptions, row.product_type)}
                                                                onChange={(option) => handleSelectChange("product_type", option, index)}
                                                                placeholder="Type"
                                                                isClearable
                                                                isDisabled={isSubmitting}
                                                                styles={customSelectStyles}
                                                            />
                                                        </div>
                                                        <div className="col-md-2">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                name="description"
                                                                value={row.description || ""}
                                                                onChange={(e) => handleInputChange(e, index)}
                                                                placeholder="Description"
                                                                disabled={isSubmitting}
                                                            />
                                                        </div>
                                                        <div className="col-md-1">
                                                            <input
                                                                type="number"
                                                                className="form-control text-end"
                                                                name="quantity_mtr"
                                                                value={row.quantity_mtr || ""}
                                                                onChange={(e) => handleInputChange(e, index)}
                                                                disabled={isSubmitting}
                                                                min="0"
                                                            />
                                                        </div>
                                                        <div className="col-md-1">
                                                            <input
                                                                type="number"
                                                                className="form-control text-end"
                                                                name="rate_per_mtr"
                                                                value={row.rate_per_mtr || ""}
                                                                onChange={(e) => handleInputChange(e, index)}
                                                                disabled={isSubmitting}
                                                                min="0"
                                                                step="0.01"
                                                            />
                                                        </div>
                                                        <div className="col-md-1">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                name="hsn_code"
                                                                value={row.hsn_code || ""}
                                                                onChange={(e) => handleInputChange(e, index)}
                                                                placeholder="HSN"
                                                                disabled={isSubmitting}
                                                            />
                                                        </div>
                                                        <div className="col-md-1">
                                                            <input
                                                                type="number"
                                                                className="form-control text-end"
                                                                name="gst_percent"
                                                                value={row.gst_percent || ""}
                                                                onChange={(e) => handleInputChange(e, index)}
                                                                disabled={isSubmitting}
                                                                min="0"
                                                                max="100"
                                                            />
                                                        </div>
                                                        <div className="col-md-2">
                                                            <div className="d-flex align-items-center justify-content-end gap-2">
                                                                <input
                                                                    type="number"
                                                                    className="form-control text-end"
                                                                    style={{ width: "150px" }}
                                                                    value={row.amount || 0}
                                                                    readOnly
                                                                />
                                                                <Button
                                                                    variant="link"
                                                                    size="sm"
                                                                    className="text-danger p-0"
                                                                    onClick={() => removeLine(index)}
                                                                    disabled={isSubmitting}
                                                                    title="Delete"
                                                                >
                                                                    <i className="bx bx-trash fs-5"></i>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                <div className="text-primary fw-semibold mt-3 mb-3">
                                                    <button
                                                        type="button"
                                                        onClick={addLine}
                                                        className="btn btn-link text-decoration-none p-0"
                                                        disabled={isSubmitting}
                                                    >
                                                        <i className="bx bx-plus-circle me-1"></i> Add a line
                                                    </button>
                                                </div>

                                                <div className="border-top pt-3 text-end">
                                                    <p className="mb-2">
                                                        <strong>Sub Total:</strong> ₹{formatCurrency(totals.subtotal)}
                                                    </p>
                                                    <p className="mb-2">GST: ₹{formatCurrency(totals.gstTotal)}</p>
                                                    <h6 className="fw-bold fs-5 text-primary">
                                                        Grand Total: ₹{formatCurrency(totals.grandTotal)}
                                                    </h6>
                                                </div>

                                                <div className="d-flex justify-content-end mt-4">
                                                    <Button
                                                        variant="outline-secondary"
                                                        className="me-2 px-4 rounded-pill"
                                                        onClick={() => navigate(-1)}
                                                        disabled={isSubmitting}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        variant="primary"
                                                        className="px-4 rounded-pill"
                                                        onClick={handleItemsSubmit}
                                                        disabled={isSubmitting}
                                                    >
                                                        {isSubmitting ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                Saving...
                                                            </>
                                                        ) : (
                                                            'Save Items'
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Taka Details Modal */}
                                    <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                                        <Modal.Header closeButton>
                                            <Modal.Title>Enter Lot Details</Modal.Title>
                                        </Modal.Header>
                                        <Modal.Body>
                                            {modalData.length === 0 ? (
                                                <div className="text-center py-4">
                                                    <p>No data to display</p>
                                                </div>
                                            ) : (
                                                <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
                                                    <table className="table table-bordered text-left align-middle mb-0">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Sr</th>
                                                                <th>Lot No</th>
                                                                <th>Meter <span className="text-danger">*</span></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {modalData.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td className="fw-semibold text-center">{item.sr}</td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="form-control text-left fw-bold"
                                                                            value={item.lot_no}
                                                                            readOnly
                                                                            style={{ minWidth: "120px", textAlign: "left" }}
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="number"
                                                                            className="form-control text-left"
                                                                            value={item.meter || ""}
                                                                            onChange={(e) => handleModalInputChange(index, "meter", e.target.value)}
                                                                            placeholder="Enter Meter"
                                                                            disabled={isSubmitting}
                                                                            min="0"
                                                                            step="0.01"
                                                                            style={{ minWidth: "120px", textAlign: "left" }}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </Modal.Body>
                                        <Modal.Footer className="d-flex justify-content-between align-items-center">
                                            <div className="fw-bold">
                                                Total Meter: {modalData.reduce((sum, item) => sum + (parseFloat(item.meter) || 0), 0).toFixed(2)}
                                            </div>
                                            <div>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => setShowModal(false)}
                                                    disabled={isSubmitting}
                                                    className="ms-2 rounded-pill"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    onClick={handleModalSubmit}
                                                    disabled={isSubmitting || modalData.length === 0}
                                                    className="ms-2 rounded-pill"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        "Save Details"
                                                    )}
                                                </Button>
                                            </div>
                                        </Modal.Footer>
                                    </Modal>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateChallanBill;