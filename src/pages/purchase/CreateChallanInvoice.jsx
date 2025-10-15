import React, { useEffect, useState } from "react";
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

export const CreateChallanBill = () => {
    const navigate = useNavigate();
    const [supplierOptions, setSupplierOptions] = useState([]);
    const [agentOptions, setAgentOptions] = useState([]);
    const [fabricOptions, setFabricOptions] = useState([]);
    const [editingPurchaseId, setEditingPurchaseId] = useState(null);
    const [showButton, setShowButton] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState([]);
    // New state to store purchase entries
    const [purchaseEntries, setPurchaseEntries] = useState([]);

    const [purchaseForm, setPurchaseForm] = useState({
        supplier_id: "",
        agent_id: "",
        challan_no: "",
        challan_date: "",
        invoice_no: "",
        invoice_date: "",
        notes: "",
        fabric_id: "",
        lot_no: "",
        hsn_code: "",
        taka_no: "",
    });

    // Centralized error handler
    const handleApiError = (error, defaultMessage) => {
        console.error("API Error:", error);
        toast.error(error.response?.data?.message || defaultMessage);
    };

    // Form validation
    const validateForm = () => {
        if (!purchaseForm.supplier_id) {
            toast.error("Please select a vendor.");
            return false;
        }
        if (!purchaseForm.agent_id) {
            toast.error("Please select an agent.");
            return false;
        }
        if (!purchaseForm.invoice_no) {
            toast.error("Please enter a party invoice number.");
            return false;
        }
        return true;
    };

    // Reset form
    const resetForm = () => {
        const today = new Date().toISOString().split("T")[0];
        setPurchaseForm({
            supplier_id: "",
            agent_id: "",
            challan_no: "",
            challan_date: today,
            invoice_no: "",
            invoice_date: today,
            notes: "",
            fabric_id: "",
            lot_no: "",
            hsn_code: "",
            taka_no: "",
        });
        setEditingPurchaseId(null);
        setShowButton(false);
        setModalData([]);
    };

    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        setPurchaseForm((prev) => ({ ...prev, challan_date: today, invoice_date: today }));

        // Fetch initial PO data
        api
            .get("/api/generate-po")
            .then((res) => {
                setPurchaseForm((prev) => ({
                    ...prev,
                    challan_no: res.data.challan_no,
                    lot_no: res.data.lot_no,
                }));
            })
            .catch((err) => handleApiError(err, "Error fetching PO."));
    }, []);

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
            ]);
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
                setSupplierOptions(
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

    const fetchAgentOptions = async () => {
        try {
            const response = await api.get("/api/get-agent");
            if (response.data && Array.isArray(response.data)) {
                setAgentOptions(
                    response.data.map((agent) => ({
                        value: agent.id,
                        label: agent.name,
                    }))
                );
            } else {
                toast.error("Failed to load agents.");
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
                    }))
                );
            } else {
                toast.error("Failed to load fabrics.");
            }
        } catch (error) {
            handleApiError(error, "Error fetching fabrics.");
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const takaNo = parseInt(purchaseForm.taka_no, 10);
        if (isNaN(takaNo) || takaNo <= 0) {
            toast.error("Please enter a valid number for Taka No.");
            return;
        }

        setIsSubmitting(true);
        try {
            const url = editingPurchaseId
                ? `/api/update-purchase-order-data/${editingPurchaseId}`
                : "/api/store-purchase-order-data";

            // 1️⃣ First save the purchase entry
            const response = await api.post(url, purchaseForm);

            // 2️⃣ Prepare modal data after successful save
            const lotBase = purchaseForm.lot_no || response.data?.data?.lot_no;
            const newModalData = Array(takaNo)
                .fill()
                .map((_, index) => ({
                    sr: index + 1,
                    lot_no: `${lotBase}-${index + 1}`,
                    meter: "",
                }));

            setModalData(newModalData);

            // 3️⃣ Open modal
            setShowModal(true);

            // 4️⃣ Keep purchase ID to update later with lot data
            setEditingPurchaseId(response.data?.data?.purchase_id);

            toast.success("Purchase saved successfully! Please enter Taka details.");
        } catch (error) {
            handleApiError(error, "Error saving purchase order.");
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleModalSubmit = async () => {
        for (const item of modalData) {
            if (!item.meter) {
                toast.error("Please enter meter value for all entries.");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            // 🟢 API to save Taka details for the given purchase
            await api.post(`/api/purchase/${editingPurchaseId}/taka-details`, {
                purchase_id: editingPurchaseId, // pass purchase_id explicitly
                taka_details: modalData,
            });

            toast.success("Taka details saved successfully!");
            setShowModal(false);
            resetForm();
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

    const handleSelectChange = (name, selectedOption) => {
        setPurchaseForm((prev) => ({
            ...prev,
            [name]: selectedOption ? selectedOption.value : "",
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPurchaseForm((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <>
            <Helmet>
                <title>ERP | Purchase Order</title>
            </Helmet>

            <div className="card">
                <h5 className="card-header d-flex justify-content-between align-items-center flex-wrap">
                    <span>Purchase Orders</span>
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
                    <div className="col-md-6 col-xl-12">
                        <div className="card-body">
                            {loading ? (
                                <Spinner message="Loading data..." />
                            ) : (
                                <form className="row g-3">
                                    <div className="col-md-3">
                                        <div className="mb-1">
                                            <label className="form-label fw-semibold">
                                                Vendor <span className="text-danger">*</span>
                                            </label>
                                            <Select
                                                options={supplierOptions}
                                                name="supplier_id"
                                                value={supplierOptions.find(
                                                    (option) => option.value === purchaseForm.supplier_id
                                                )}
                                                onChange={(option) =>
                                                    handleSelectChange("supplier_id", option)
                                                }
                                                placeholder="Select Vendor"
                                                isClearable
                                                isDisabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="mb-1">
                                            <label className="form-label fw-semibold">
                                                Agent <span className="text-danger">*</span>
                                            </label>
                                            <Select
                                                options={agentOptions}
                                                name="agent_id"
                                                value={agentOptions.find(
                                                    (option) => option.value === purchaseForm.agent_id
                                                )}
                                                onChange={(option) =>
                                                    handleSelectChange("agent_id", option)
                                                }
                                                placeholder="Select Agent"
                                                isClearable
                                                isDisabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="mb-1">
                                            <label className="form-label fw-semibold">Challan No</label>
                                            <input
                                                type="text"
                                                className="form-control fw-bold"
                                                name="challan_no"
                                                value={purchaseForm.challan_no}
                                                onChange={handleInputChange}
                                                placeholder="CIN-0001"
                                                readOnly
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="mb-1">
                                            <label className="form-label fw-semibold">Challan Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="challan_date"
                                                value={purchaseForm.challan_date}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="mb-1">
                                            <label className="form-label fw-semibold">
                                                Party Invoice No <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="invoice_no"
                                                value={purchaseForm.invoice_no}
                                                onChange={handleInputChange}
                                                placeholder="Enter Party Invoice No"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="mb-1">
                                            <label className="form-label fw-semibold">Invoice Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="invoice_date"
                                                value={purchaseForm.invoice_date}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="mb-1">
                                            <label className="form-label fw-semibold">Notes</label>
                                            <textarea
                                                className="form-control"
                                                name="notes"
                                                rows="4"
                                                value={purchaseForm.notes}
                                                onChange={handleInputChange}
                                                placeholder="Additional notes..."
                                                disabled={isSubmitting}
                                            ></textarea>
                                        </div>
                                    </div>

                                    <hr className="mt-3 mb-0 shadow-sm" />

                                    <div className="col-md-3">
                                        <div className="mb-1">
                                            <label className="form-label fw-semibold">Fabric</label>
                                            <Select
                                                options={fabricOptions}
                                                name="fabric_id"
                                                value={fabricOptions.find(
                                                    (option) => option.value === purchaseForm.fabric_id
                                                )}
                                                onChange={(option) => {
                                                    handleSelectChange("fabric_id", option);
                                                    setShowButton(!!option);
                                                }}
                                                placeholder="Select Fabric"
                                                isClearable
                                                isDisabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-2">
                                        <div className="mb-1">
                                            <label className="form-label fw-semibold">Lot No</label>
                                            <input
                                                type="text"
                                                className="form-control fw-bold"
                                                name="lot_no"
                                                value={purchaseForm.lot_no}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                                readOnly
                                                placeholder="LOT-0001"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-2">
                                        <div className="mb-1">
                                            <label className="form-label fw-semibold">HSN Code</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="hsn_code"
                                                value={purchaseForm.hsn_code}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                                placeholder="12345678"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-2">
                                        <div className="mb-1">
                                            <label className="form-label fw-semibold">Taka No</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="taka_no"
                                                value={purchaseForm.taka_no}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                                placeholder="Enter Taka No"
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                    {showButton && (
                                        <div className="col-md-3 d-flex align-items-end py-2">
                                            <Button
                                                variant="primary"
                                                onClick={handleSubmit}
                                                disabled={isSubmitting}
                                                aria-label={editingPurchaseId ? "Update Purchase" : "Save Purchase"}
                                                className="ms-1 rounded-pill"
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
                                                        <i className="bx bx-book-add me-1"></i>
                                                        {editingPurchaseId ? "Update Purchase" : "Save Purchase"}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Enter Lot Details</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
                        <input
                            type="hidden"
                            name="purchase_id"
                            value={editingPurchaseId}
                        />
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
                                                style={{ minWidth: "100px", textAlign: "left" }}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="form-control text-left"
                                                value={item.meter}
                                                onChange={(e) =>
                                                    handleModalInputChange(index, "meter", e.target.value)
                                                }
                                                placeholder="Enter Meter"
                                                disabled={isSubmitting}
                                                min="0"
                                                style={{ minWidth: "100px", textAlign: "left" }}
                                            />

                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>

                <Modal.Footer className="d-flex justify-content-between align-items-center">
                    <div className="fw-bold">
                        Total Meter :{" "}
                        {modalData.reduce((sum, item) => sum + (parseFloat(item.meter) || 0), 0)}
                    </div>
                    <div>
                        <Button
                            variant="secondary"
                            onClick={() => setShowModal(false)}
                            disabled={isSubmitting}
                            className="ms-1 rounded-pill"
                        >
                            <i className="bx bx-window-close me-1"></i>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleModalSubmit}
                            disabled={isSubmitting}
                            className="ms-1 rounded-pill"
                        >
                            <i className="bx bx-book-add me-1"></i>
                            {isSubmitting ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-1"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    Saving...
                                </>
                            ) : (
                                "Save Details"
                            )}
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default CreateChallanBill;