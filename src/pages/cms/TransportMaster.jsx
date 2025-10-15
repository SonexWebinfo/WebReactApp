import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Helmet } from "react-helmet-async";
import { toast } from 'react-toastify';
import Select from "react-select";

const Spinner = ({ message = "Loading..." }) => (
    <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{message}</span>
        </div>
    </div>
);

export const TransportTable = () => {
    const [transportData, setTransportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [editingTransportId, setEditingTransportId] = useState(null);
    const [stateOptions, setStateOptions] = useState([]);
    const [cityOptions, setCityOptions] = useState([]);
    const [filteredCityOptions, setFilteredCityOptions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const itemsPerPage = 10;

    const [transportForm, setTransportForm] = useState({
        transport_name: "",
        transport_contact_person: "",
        transport_alternate_phone: "",
        transport_phone: "",
        transport_address: "",
        transport_state: "",
        transport_city: "",
        transport_pincode: "",
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchTransportData(), fetchStateOptions(), fetchCityOptions()]);
        setLoading(false);
    };

    const fetchStateOptions = async () => {
        try {
            const response = await api.get("/api/get-states");
            if (response.data && Array.isArray(response.data)) {
                setStateOptions(
                    response.data.map((state) => ({
                        value: state.id,
                        label: state.name,
                    }))
                );
            } else {
                toast.error("Failed to load states.");
            }
        } catch (error) {
            console.error("Error fetching states:", error);
            toast.error("Error fetching states.");
        }
    };

    const fetchCityOptions = async () => {
        try {
            const response = await api.get("/api/get-cities");
            if (response.data && Array.isArray(response.data)) {
                setCityOptions(
                    response.data.map((city) => ({
                        value: city.id,
                        label: city.name,
                        stateId: city.state_id,
                    }))
                );
            } else {
                toast.error("Failed to load cities.");
            }
        } catch (error) {
            console.error("Error fetching cities:", error);
            toast.error("Error fetching cities.");
        }
    };

    const fetchTransportData = async () => {
        try {
            const response = await api.get("/api/fetch-transport-table-data");
           // console.log("Transport Data:", response.data);
            if (Array.isArray(response.data)) {
                setTransportData(response.data);
            } else if (response.data && Array.isArray(response.data.data)) {
                setTransportData(response.data.data);
            } else {
                toast.error("Unexpected API response format.");
            }
        } catch (error) {
            //console.error("Error fetching transport data:", error);
            toast.error("Failed to fetch transport data.");
        }
    };

    const handleStateChange = (selectedOption) => {
        const stateId = selectedOption?.value || "";
        setTransportForm((prev) => ({
            ...prev,
            transport_state: stateId,
            transport_city: "",
        }));
        setFilteredCityOptions(cityOptions.filter((city) => city.stateId === stateId));
    };

    const handleCityChange = (selectedOption) => {
        setTransportForm((prev) => ({
            ...prev,
            transport_city: selectedOption?.value || "",
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTransportForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateForm = () => {
        const { transport_name, transport_phone, transport_state, transport_city } = transportForm;
        if (!transport_name || !transport_phone  || !transport_state || !transport_city) {
            toast.warning("Please fill in all required fields.");
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            if (editingTransportId) {
                await api.put(`/api/update-transport-data/${editingTransportId}`, transportForm);
                toast.success("Transport updated successfully!");
            } else {
                await api.post("/api/store-transport-data", transportForm);
                toast.success("Transport added successfully!");
            }
            fetchTransportData();
            resetForm();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error submitting transport data:", error);
            toast.error("Something went wrong!");
        }
    };

    const editTransport = async (transportId) => {
        try {
            const response = await api.get(`/api/get-transport-data/${transportId}`);
            if (response?.data?.data) {
                const transportData = response.data.data;
                const stateId = parseInt(transportData.state_id) || 0;
                setFilteredCityOptions(cityOptions.filter((city) => city.stateId === stateId));
                setTransportForm({
                    transport_name: transportData.transport_name || "",
                    transport_contact_person: transportData.transport_contact_person || "",
                    transport_alternate_phone: transportData.transport_alternate_phone || "",
                    transport_phone: transportData.transport_phone || "",
                    transport_address: transportData.transport_address || "",
                    transport_state: stateId,
                    transport_city: parseInt(transportData.city_id) || 0,
                    transport_pincode: transportData.transport_pincode || "",
                });
                setEditingTransportId(transportId);
                setIsModalOpen(true);
            } else {
                toast.error("Transport data not found or invalid format.");
            }
        } catch (error) {
            console.error("Error fetching transport data:", error);
            toast.error("Error fetching transport data.");
        }
    };

    const deleteTransport = async (transportId) => {
        if (!window.confirm("Are you sure you want to delete this Transport?")) return;

        try {
            const response = await api.delete(`/api/delete-transport/${transportId}`);
            if (response.status === 200) {
                toast.success("Transport deleted successfully!");
                setTransportData((prevData) => prevData.filter((transport) => transport.trans_id !== transportId));
            } else {
                toast.error("Failed to delete transport.");
            }
        } catch (error) {
            console.error("Error deleting transport:", error);
            toast.warning("Something went wrong!");
        }
    };

    const resetForm = () => {
        setTransportForm({
            transport_name: "",
            transport_contact_person: "",
            transport_alternate_phone: "",
            transport_phone: "",
            transport_address: "",
            transport_state: "",
            transport_city: "",
            transport_pincode: "",
        });
        setEditingTransportId(null);
    };

    return (
        <>
            <Helmet>
                <title>ERP | Transport Master</title>
            </Helmet>
            <div className="card">
                <h5 className="card-header d-flex justify-content-between align-items-center flex-wrap">
                    <span>Basic Info Transport Details</span>
                    <div className="btn-group mt-2 mt-md-0">
                        <button aria-label='Click me'
                            type="button"
                            className="btn btn-primary btn-sm dropdown-toggle"
                            data-bs-toggle="dropdown"
                            aria-expanded="false">
                            <i className='bx bxs-truck'></i>&nbsp;Manage Transport
                        </button>
                        <ul className="dropdown-menu">
                            <li><a aria-label="dropdown action link" className="dropdown-item" href="#" onClick={() => setIsModalOpen(true)}><i className='bx bxs-truck'></i> Add Transport</a></li>
                            <li>
                                <hr className="dropdown-divider" />
                            </li>
                            <li><a aria-label="dropdown action link" className="dropdown-item" href="#"><i className="bx bx-cloud-download"></i> Demo File</a></li>
                            <li><a aria-label="dropdown action link" className="dropdown-item" href="#"><i className="bx bx-cloud-upload"></i> Import</a></li>
                            <li><a aria-label="dropdown action link" className="dropdown-item" href="#"><i className="bx bx-cloud-download"></i> Export</a></li>
                        </ul>
                    </div>
                    
                </h5>
                <hr className="mt-0 mb-0 shadow-sm" />
                <div className="table-responsive text-nowrap fs-6">
                    {loading ? (
                        <Spinner />
                    ) : (
                        <table className="table table-hover text-nowrap">
                            <thead className="table-light">
                                <tr>
                                    <th className="text-center">Sr.</th>
                                    <th>Transport Name</th>
                                    <th>Contact Person</th>
                                    <th>Phone No</th>
                                    <th>City</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transportData.length > 0 ? (
                                    transportData.map((transport, index) => (
                                        <tr key={transport.trans_id || index}>
                                            <td className="text-center">{index + 1}</td>
                                            <td>{transport.transport_name || "N/A"}</td>
                                            <td>{transport. transport_contact_person || "N/A"}</td>
                                            <td>{transport.transport_phone || "N/A"}</td>
                                            <td>{transport.city_name || "N/A"}</td>
                                            <td>
                                            <div className="dropdown">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-primary"
                                                        data-bs-toggle="dropdown">
                                                        <i className='bx bx-down-arrow-circle'></i>
                                                    </button>
                                                    <div className="dropdown-menu">
                                                        <button
                                                            className="dropdown-item me-2"
                                                            onClick={() => editTransport(transport.trans_id)}
                                                        >
                                                            <i className='bx bx-edit'></i>
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="dropdown-item me-2"
                                                            onClick={() => deleteTransport(transport.trans_id)}
                                                        >
                                                            <i className='bx bx-trash'></i>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center">
                                            No records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="modal fade show d-block" tabIndex="-1" aria-hidden="true">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingTransportId ? "Edit Transport" : "Create Transport Master"}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setIsModalOpen(false)}
                                ></button>
                            </div>
                            <hr className="mb-0 shadow-sm" />
                            <div className="modal-body">
                                <div className="row">
                                    {/* Form Fields */}
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Transport Name</label>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                name="transport_name"
                                                value={transportForm.transport_name}
                                                onChange={handleChange}
                                                className="form-control"
                                                placeholder="Enter Transport Name"
                                                required
                                            />
                                            <span className="input-group-text bg-primary text-white"><i className="bx bxs-truck"></i></span>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label"> Contact Person Name</label>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                name="transport_contact_person"
                                                value={transportForm.transport_contact_person}
                                                onChange={handleChange}
                                                className="form-control"
                                                placeholder="Enter Contact Person Name"
                                                required
                                            />
                                            <span className="input-group-text bg-primary text-white"><i className="bx bx-user"></i></span>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Phone No</label>
                                        <div className="input-group">
                                        <input
                                            type="text"
                                            name="transport_phone"
                                            value={transportForm.transport_phone}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Enter Phone No"
                                            maxLength={10}
                                            pattern="[0-9]{10}"
                                            required
                                        />
                                        <span className="input-group-text bg-primary text-white"><i className="bx bx-phone"></i></span>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Alternate Phone No</label>
                                        <div className="input-group">
                                        <input
                                            type="text"
                                            name="transport_alternate_phone"
                                            value={transportForm.transport_alternate_phone}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Enter Alternate Phone No"
                                            maxLength={10}
                                            pattern="[0-9]{10}"
                                            required
                                        />
                                        <span className="input-group-text bg-primary text-white"><i className="bx bx-phone"></i></span>
                                        </div>
                                    </div>

                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">Address</label>
                                        <textarea
                                            name="transport_address"
                                            value={transportForm.transport_address}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Enter Address"
                                            rows="2"
                                            required
                                        ></textarea>
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">State</label>
                                        <Select
                                            options={stateOptions}
                                            name="transport_state"
                                            value={stateOptions.find(
                                                (option) => option.value === transportForm.transport_state
                                            )}
                                            onChange={handleStateChange}
                                            placeholder="Select State"
                                            isClearable
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">City</label>
                                        <Select
                                            options={filteredCityOptions}
                                            name="transport_city"
                                            isDisabled={!transportForm.transport_state}
                                            value={filteredCityOptions.find(
                                                (option) => option.value === transportForm.transport_city
                                            )}
                                            onChange={handleCityChange}
                                            placeholder="Select City"
                                            isClearable
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Pincode</label>
                                        <div className="input-group">
                                        <input
                                            type="text"
                                            name="transport_pincode"
                                            value={transportForm.transport_pincode}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Enter Pincode"
                                            maxLength={6}
                                            pattern="[0-9]{6}"
                                        />
                                         <span className="input-group-text bg-primary text-white"><i className="bx bx-map-pin"></i></span>
                                         </div>
                                    </div>
                                    
                                </div>
                            </div>
                            <hr className="mb-0 shadow-sm" />
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    <i className="bx bx-x"></i>
                                    Close
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={handleSubmit}
                                >
                                    <i className="bx bx-save"></i>
                                    {editingTransportId ? "Update Transport" : "Save Transport"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TransportTable;