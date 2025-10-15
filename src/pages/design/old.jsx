

import React, { useEffect, useState, useCallback } from "react";
import { api } from "../../services/api";
import { Helmet } from "react-helmet-async";
import toastr from "toastr";
import "toastr/build/toastr.min.css";
import { debounce } from "lodash";

export const DesignTable = () => {
    const [designData, setDesignData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageLoading, setPageLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("all");
    const [editingDesignId, setEditingDesignId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        from: 0,
        to: 0,
    });
    const [searchText, setSearchText] = useState("");
    const [perPage, setPerPage] = useState(25);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [designForm, setDesignForm] = useState({
        design_name: "",
        work: "",
        print: "",
        margin: "",
        design_images: [],
    });

    const fetchDesignData = useCallback(async (page = 1, search = searchText, perPageCount = perPage) => {
        setPageLoading(true);
        try {
            const response = await api.get(`/api/fetch-design-table-data`, {
                params: {
                    page,
                    design_name: search,
                    per_page: perPageCount,
                    status: statusFilter === "all" ? undefined : statusFilter,
                },
            });

            console.log("API Response:", response);
            const data = Array.isArray(response.data?.data) ? response.data.data : [];
            if (data.length > 0) {
                setDesignData(data);
            }
            setPagination({
                currentPage: response.data.pagination?.current_page || 1,
                lastPage: response.data.pagination?.last_page || 1,
                total: response.data.pagination?.total || 0,
                from: response.data.pagination?.from || 0,
                to: response.data.pagination?.to || 0,
            });
            setCurrentPage(response.data.pagination?.current_page || page);
        } catch (error) {
            console.error("Error fetching design data:", {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            setDesignData([]);
            toastr.error(error.response?.data?.message || "Failed to fetch design data. Please try again.");
        } finally {
            setLoading(false);
            setPageLoading(false);
        }
    }, [searchText, perPage, statusFilter]);

    const debouncedFetchDesignData = useCallback(
        debounce((page, search, perPageCount) => {
            fetchDesignData(page, search, perPageCount);
        }, 500),
        [fetchDesignData]
    );

    const handleSearchChange = (e) => {
        const value = e.target.value.trim();
        setSearchText(value);
        debouncedFetchDesignData(1, value, perPage);
        setCurrentPage(1);
    };

    useEffect(() => {
        fetchDesignData(1, "", perPage);
    }, [fetchDesignData]);

    const handlePageChange = (page) => {
        console.log("Navigating to page:", page);
        if (page > 0 && page <= pagination.lastPage && page !== currentPage) {
            fetchDesignData(page);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDesignForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setDesignForm((prevForm) => ({
            ...prevForm,
            design_images: files,
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("design_name", designForm.design_name);
            formData.append("work", designForm.work);
            formData.append("print", designForm.print);
            formData.append("margin", designForm.margin);

            if (Array.isArray(designForm.design_images)) {
                designForm.design_images.forEach((file, index) => {
                    if (file instanceof File) {
                        formData.append(`design_images[${index}]`, file);
                    }
                });
            }

            for (let pair of formData.entries()) {
                console.log(`${pair[0]}: ${pair[1]}`);
            }

            const url = editingDesignId
                ? `/api/update-design-data/${editingDesignId}`
                : `/api/store-design-data`;

            await api.post(url, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            toastr.success(`Design ${editingDesignId ? "updated" : "added"} successfully!`);
            fetchDesignData(currentPage);
            setShowModal(false);
            resetForm();
        } catch (err) {
            const status = err.response?.status;
            const message = err.response?.data?.message;

            if (status === 409) {
                toastr.error(message || "This design name already exists.");
            } else if (status === 422) {
                toastr.error("Please fix the validation errors.");
            } else {
                toastr.error("An unexpected error occurred.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const editDesign = async (designId) => {
        try {
            const response = await api.get(`/api/get-design-data/${designId}`);
            console.log("Edit Design Response:", response.data);
            const design = response.data?.data;
            if (!design) {
                toastr.error("Error: Design data not found!");
                return;
            }
            setDesignForm({
                design_id: design.design_id || null,
                design_name: design.design_name || "",
                work: design.work || "",
                print: design.print || "",
                margin: design.margin || "",
                design_images: design.design_images || [],
            });
            setEditingDesignId(designId);
            setShowModal(true);
        } catch (error) {
            console.error("Error fetching design data:", error);
            toastr.error(error.response?.data?.message || "Error fetching design data.");
        }
    };

    const deleteDesign = async (designId) => {
        if (!window.confirm("Are you sure you want to delete this design?")) return;

        try {
            const response = await api.delete(`/api/delete-design/${designId}`);
            if (response.status === 200) {
                toastr.success("Design deleted successfully!");
                fetchDesignData(currentPage);
            } else {
                toastr.warning("Something went wrong!");
            }
        } catch (error) {
            console.error("Error deleting design:", error);
            toastr.error("Error deleting design.");
        }
    };

    const resetForm = () => {
        setDesignForm({
            design_name: "",
            work: "",
            print: "",
            margin: "",
            design_images: [],
        });
        setEditingDesignId(null);
        setShowModal(false);
    };

    const filteredData = Array.isArray(designData) ? designData : [];

    return (
        <>
            <Helmet>
                <title>ERP | Design Master</title>
            </Helmet>
            <div className="card">
                <h5 className="card-header d-flex justify-content-between align-items-center flex-wrap">
                    <span>Basic Info Design Details</span>
                    <div className="btn-group mt-2 mt-md-0">
                        <button
                            aria-label="Click me"
                            type="button"
                            className="btn btn-primary btn-sm dropdown-toggle"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <i className="bx bx-menu-alt-left"></i> Manage Design
                        </button>
                        <ul className="dropdown-menu">
                            <li>
                                <button
                                    aria-label="dropdown action link"
                                    className="dropdown-item"
                                    onClick={() => {
                                        resetForm();
                                        setShowModal(true);
                                    }}
                                >
                                    <i className="bx bx-plus-circle"></i> Add Design
                                </button>
                            </li>
                            <li>
                                <hr className="dropdown-divider" />
                            </li>
                            <li>
                                <a aria-label="dropdown action link" className="dropdown-item" href="#">
                                    <i className="bx bx-cloud-download"></i> Demo File
                                </a>
                            </li>
                            <li>
                                <a aria-label="dropdown action link" className="dropdown-item" href="#">
                                    <i className="bx bx-cloud-upload"></i> Import
                                </a>
                            </li>
                            <li>
                                <a aria-label="dropdown action link" className="dropdown-item" href="#">
                                    <i className="bx bx-cloud-download"></i> Export
                                </a>
                            </li>
                        </ul>
                    </div>
                </h5>
                <hr className="mt-0 mb-0 shadow-sm" />
                <div className="card-header d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <label htmlFor="perPageSelect" className="mb-0 fw-semibold">
                            Show
                        </label>
                        <select
                            id="perPageSelect"
                            className="form-select form-select-sm"
                            style={{ width: "80px" }}
                            value={perPage}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                setPerPage(value);
                                fetchDesignData(1, searchText, value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="75">75</option>
                            <option value="100">100</option>
                        </select>
                        <label htmlFor="statusFilter" className="mb-0 fw-semibold">
                            Status
                        </label>
                        <select
                            id="statusFilter"
                            className="form-select form-select-sm"
                            style={{ width: "120px" }}
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                fetchDesignData(1, searchText, perPage);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div style={{ maxWidth: "250px", width: "100%" }}>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search Design Name"
                            value={searchText}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>
                <div className="table-responsive text-nowrap fs-6">
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center p-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <table className="table table-hover text-nowrap">
                                <thead className="table-light">
                                    <tr>
                                        <th className="text-center">Sr.</th>
                                        <th>Images</th>
                                        <th>Design Name</th>
                                        <th>Work Cost</th>
                                        <th>Print Cost</th>
                                        <th>Margin(%)</th>
                                        <th>Rate</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="table-border-bottom-0">
                                    {pageLoading ? (
                                        <tr>
                                            <td colSpan="8" className="text-center p-5">
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredData.length > 0 ? (
                                        filteredData.map((design, index) => (
                                            <tr key={design?.design_id || index}>
                                                <td className="text-center">{pagination.from + index}</td>
                                                <td>
                                                    <img
                                                        src={
                                                            Array.isArray(design?.design_images) && design.design_images.length > 0
                                                                ? `https://backend-api.3stage.in/public/${design.design_images.at(-1)}`
                                                                : "/images/default-design.png"
                                                        }
                                                        alt="Design"
                                                        style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                                        onError={(e) => (e.target.src = "/images/default-design.png")}
                                                    />
                                                </td>
                                                <td>{design?.design_name || "N/A"}</td>
                                                <td>{design?.work || "0.00"}</td>
                                                <td>{design?.print || "0.00"}</td>
                                                <td>{design?.margin || "0"}%</td>
                                                <td>{design?.rate || "0.00"}</td>
                                                <td>
                                                    <div className="dropdown">
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary btn-sm dropdown-toggle hide-arrow"
                                                            data-bs-toggle="dropdown"
                                                        >
                                                            <i className="bx bx-down-arrow-circle"></i>
                                                        </button>
                                                        <div className="dropdown-menu">
                                                            <button
                                                                type="button"
                                                                className="dropdown-item"
                                                                onClick={() => editDesign(design.design_id)}
                                                            >
                                                                <i className="bx bx-edit-alt me-1"></i> Edit
                                                            </button>
                                                            <button
                                                                className="dropdown-item"
                                                                onClick={() => deleteDesign(design.design_id)}
                                                            >
                                                                <i className="bx bx-trash me-1"></i> Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="text-center">
                                                No records found. {searchText ? "Try a different search term." : "Add a new design."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <hr className="mt-0 mb-0 shadow-sm" />
                            {pagination.total > 0 && (
                                <div className="d-flex justify-content-end align-items-center gap-2 mb-3 pt-3 py-3">
                                    <span className="fw-semibold">
                                        {pagination.from} - {pagination.to} of {pagination.total}
                                    </span>
                                    <div className="btn-group">
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            <i className="bx bx-chevron-left" /> Previous
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === pagination.lastPage || pagination.total === 0}
                                        >
                                            <i className="bx bx-chevron-right" /> Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <Modal show={showModal} onHide={resetForm}>
                <Modal.Header>
                    <Modal.Title>{editingDesignId ? "Edit Design" : "Create Design Master"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="row">
                        <div className="col-md-12 mb-3">
                            <label className="form-label">Design Name</label>
                            <input
                                type="text"
                                name="design_name"
                                value={designForm.design_name || ""}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="Enter Design Name"
                                required
                            />
                        </div>
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Work Cost</label>
                            <div className="input-group">
                                <input
                                    type="number"
                                    name="work"
                                    value={designForm.work || ""}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Enter Work Cost"
                                    required
                                />
                                <span className="input-group-text bg-primary text-white fw-bold">₹</span>
                            </div>
                        </div>
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Print Cost</label>
                            <div className="input-group">
                                <input
                                    type="number"
                                    name="print"
                                    value={designForm.print || ""}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Enter Print Cost"
                                    required
                                />
                                <span className="input-group-text bg-primary text-white fw-bold">₹</span>
                            </div>
                        </div>
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Margin (%)</label>
                            <div className="input-group">
                                <input
                                    type="number"
                                    name="margin"
                                    value={designForm.margin || ""}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Enter Margin(%)"
                                    required
                                />
                                <span className="input-group-text bg-primary text-white fw-bold">%</span>
                            </div>
                        </div>
                        <div className="col-md-12 mb-3">
                            <label className="form-label">Upload Image</label>
                            <div className="input-group">
                                <input
                                    type="file"
                                    name="design_images"
                                    multiple
                                    onChange={handleImageChange}
                                    className="form-control"
                                />
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" size="sm" onClick={resetForm}>
                        <i className="bx bx-window-close"></i> Close
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
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
                                {editingDesignId ? "Update Design" : "Save Design"}
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default DesignTable;