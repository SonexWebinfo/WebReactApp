import React, { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../../services/api";
import { Helmet } from "react-helmet-async";
import { debounce } from "lodash";
import { toast } from 'react-toastify';
import { Modal, Button } from "react-bootstrap";

export const FabricTable = () => {
  const [fabricData, setFabricData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingFabricId, setEditingFabricId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [fabricForm, setFabricForm] = useState({
    fabric_name: "",
    cost: "",
    shortage: "",
  });
  const [searchText, setSearchText] = useState("");
  const [perPage, setPerPage] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Centralized error handling
  const handleApiError = (error, defaultMessage) => {
    console.error("API Error:", error);
    toast.error(error.response?.data?.message || defaultMessage);
  };

  // Fetch fabric data
  const fetchFabricData = useCallback(
    async (page = 1, search = "", perPageCount = perPage) => {
      setPageLoading(true);
      try {
        console.log("Fetching with params:", {
          page,
          fabric_name: search,
          per_page: perPageCount,
          status: statusFilter,
        });
        const response = await api.get("/api/fetch-fabric-table-data", {
          params: {
            page,
            fabric_name: search, // Verify this matches the backend's expected parameter
            per_page: perPageCount,
            status: statusFilter === "all" ? undefined : statusFilter,
          },
        });

        console.log("API Response:", response.data);

        const data = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        setFabricData(data);

        setPagination({
          currentPage: response.data.pagination?.current_page || 1,
          lastPage: response.data.pagination?.last_page || 1,
          total: response.data.pagination?.total || 0,
          from: response.data.pagination?.from || 0,
          to: response.data.pagination?.to || 0,
        });
      } catch (error) {
        handleApiError(error, "Failed to fetch fabric data.");
        setFabricData([]);
      } finally {
        setLoading(false);
        setPageLoading(false);
      }
    },
    [perPage, statusFilter] // Removed searchText from dependencies
  );

  useEffect(() => {
    fetchFabricData();
  }, [fetchFabricData]);

  // Debounced fetch
  const debouncedFetchFabricData = useMemo(
    () =>
      debounce((page, search, perPageCount) => {
        fetchFabricData(page, search, perPageCount);
      }, 500),
    [fetchFabricData]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value.trim();
    setSearchText(value);
    debouncedFetchFabricData(1, value, perPage);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Clear search
  const clearSearch = () => {
    setSearchText("");
    fetchFabricData(1, "", perPage);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Filter data based on status
  const filteredData = useMemo(() => {
    return fabricData.filter((fabric) => {
      if (statusFilter === "active")
        return fabric.status === 0 || fabric.status === "active";
      if (statusFilter === "inactive")
        return fabric.status === 1 || fabric.status === "inactive";
      return true;
    });
  }, [fabricData, statusFilter]);

  // Handle page change
  const handlePageChange = (page) => {
    if (
      page > 0 &&
      page <= pagination.lastPage &&
      page !== pagination.currentPage
    ) {
      fetchFabricData(page, searchText);
    }
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFabricForm((prev) => ({
      ...prev,
      [name]:
        name === "fabric_name" ? value : value === "" ? "" : Number(value),
    }));
  };

  // Validate and submit form
  const handleSubmit = async () => {
    if (
      !fabricForm.fabric_name ||
      fabricForm.cost < 0 ||
      fabricForm.shortage < 0
    ) {
      toast.error("Please fill in all fields correctly.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingFabricId
        ? `/api/update-fabric-data/${editingFabricId}`
        : `/api/store-fabric-data`;

      await api.post(url, fabricForm);
      toast.success(
        `Fabric ${editingFabricId ? "updated" : "added"} successfully!`
      );
      fetchFabricData(pagination.currentPage);
      setShowModal(false);
      resetForm();
    } catch (error) {
      const status = error.response?.status;
      if (status === 409) {
        handleApiError(error, "This Fabric name already exists.");
      } else if (status === 422) {
        handleApiError(error, "Please fix the validation errors.");
      } else {
        handleApiError(error, "An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit fabric
  const editFabric = async (fabricId) => {
    try {
      const response = await api.get(`/api/get-fabric-data/${fabricId}`);
      if (!response.data?.data) {
        handleApiError(null, "Error: Fabric data not found!");
        return;
      }
      setFabricForm({
        fabric_name: response.data.data.fabric_name || "",
        cost: response.data.data.cost || "",
        shortage: response.data.data.shortage || "",
      });
      setEditingFabricId(fabricId);
      setShowModal(true);
    } catch (error) {
      handleApiError(error, "Error fetching fabric data.");
    }
  };

  // Delete fabric
  const deleteFabric = async (fabricId) => {
    if (!window.confirm("Are you sure you want to delete this fabric?")) return;

    setDeletingId(fabricId);
    try {
      await api.delete(`/api/delete-fabric/${fabricId}`);
      toast.success("Fabric deleted successfully!");
      fetchFabricData(pagination.currentPage);
    } catch (error) {
      handleApiError(error, "Failed to delete fabric.");
    } finally {
      setDeletingId(null);
    }
  };

  // Modal controls
  const handleClose = () => {
    setShowModal(false);
    resetForm();
  };

  const handleShow = () => {
    setShowModal(true);
  };

  const resetForm = () => {
    setFabricForm({ fabric_name: "", cost: "", shortage: "" });
    setEditingFabricId(null);
  };

  // Calculate start index for table
  const startIndex = (pagination.currentPage - 1) * perPage;

  return (
    <>
      <Helmet>
        <title>ERP | Fabric Master</title>
      </Helmet>
      <div className="card">
        <h5 className="card-header d-flex justify-content-between align-items-center flex-wrap">
          <span>Basic Info Fabric Details</span>
          <div className="btn-group mt-2 mt-md-0">
            <button
              aria-label="Manage Fabric"
              type="button"
              className="btn btn-primary btn-sm dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="bx bxs-package"></i> Manage Fabric
            </button>
            <ul className="dropdown-menu">
              <li>
                <button
                  aria-label="Add Fabric"
                  className="dropdown-item"
                  onClick={handleShow}
                >
                  <i className="bx bx-plus-circle"></i> Add Fabric
                </button>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <a
                  aria-label="Download Demo File"
                  className="dropdown-item"
                  href="#"
                >
                  <i className="bx bx-cloud-download"></i> Demo File
                </a>
              </li>
              <li>
                <a
                  aria-label="Import Fabric"
                  className="dropdown-item"
                  href="#"
                >
                  <i className="bx bx-cloud-upload"></i> Import
                </a>
              </li>
              <li>
                <a
                  aria-label="Export Fabric"
                  className="dropdown-item"
                  href="#"
                >
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
              className="form-select form-select-sm fw-bold"
              style={{ width: "80px" }}
              value={perPage}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setPerPage(value);
                fetchFabricData(1, searchText, value);
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
              }}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="75">75</option>
              <option value="100">100</option>
            </select>
          </div>
          <div
            className="d-flex align-items-center gap-2"
            style={{ maxWidth: "200px", width: "100%" }}
          >
            <input
              type="text"
              className="form-control form-control-sm fw-semibold"
              placeholder="Search Fabric Name"
              value={searchText}
              onChange={handleSearchChange}
              aria-label="Search Fabric Name"
            />
            {searchText && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={clearSearch}
                aria-label="Clear Search"
              >
                <i className="bx bx-x"></i>
              </button>
            )}
          </div>
        </div>
        <div className="table-responsive text-nowrap fs-6">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredData.length > 0 ? (
            <>
              <table className="table table-hover text-nowrap">
                <thead className="table-light">
                  <tr>
                    <th className="text-center">Sr.</th>
                    <th>Fabric Name</th>
                    <th>Cost</th>
                    <th>Shortage</th>
                    <th>Cost Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody className="table-border-bottom-0">
                  {pageLoading ? (
                    <tr>
                      <td colSpan="6" className="text-center p-5">
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((fabric, index) => (
                      <tr key={fabric?.fabric_id || index}>
                        <td className="text-center">
                          {startIndex + index + 1}
                        </td>
                        <td>{fabric?.fabric_name || "N/A"}</td>
                        <td>{fabric?.cost || "0.00"}</td>
                        <td>{fabric?.shortage || "0"}%</td>
                        <td>{fabric?.cost_price || "0.00"}</td>
                        <td>
                          <div className="dropdown">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm dropdown-toggle hide-arrow"
                              data-bs-toggle="dropdown"
                              aria-label="Action Menu"
                            >
                              <i className="bx bx-down-arrow-circle"></i>
                            </button>
                            <div className="dropdown-menu">
                              <button
                                className="dropdown-item"
                                onClick={() => editFabric(fabric.fabric_id)}
                                aria-label="Edit Fabric"
                              >
                                <i className="bx bx-edit-alt me-1"></i> Edit
                              </button>
                              <button
                                className="dropdown-item"
                                onClick={() => deleteFabric(fabric.fabric_id)}
                                disabled={deletingId === fabric.fabric_id}
                                aria-label="Delete Fabric"
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
                      <td colSpan="6" className="text-center">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <hr className="mt-0 mb-0 shadow-sm" />
              {pagination.total > 0 && (
                <div className="d-flex justify-content-end align-items-center gap-2 mb-3 pt-3 me-2">
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
        aria-labelledby="fabricModalTitle"
      >
        <Modal.Header closeButton>
          <Modal.Title id="fabricModalTitle">
            {editingFabricId ? "Edit Fabric" : "Create Fabric Master"}
          </Modal.Title>
        </Modal.Header>
        <hr className="mt-0 mb-0 shadow-sm" />
        <Modal.Body>
          <div className="row">
            <div className="col-md-12 mb-3">
              <label className="form-label" htmlFor="fabric_name">
                Fabric Name
              </label>
              <input
                type="text"
                id="fabric_name"
                name="fabric_name"
                value={fabricForm.fabric_name}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter Fabric Name"
                required
                aria-required="true"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="cost">
                Cost
              </label>
              <div className="input-group">
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  value={fabricForm.cost}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Cost"
                  min="0"
                  step="0.01"
                  required
                  aria-required="true"
                />
                <span className="input-group-text bg-primary text-white">
                  ₹
                </span>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="shortage">
                Shortage (%)
              </label>
              <div className="input-group">
                <input
                  type="number"
                  id="shortage"
                  name="shortage"
                  value={fabricForm.shortage}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Shortage"
                  min="0"
                  step="0.01"
                  required
                  aria-required="true"
                />
                <span className="input-group-text bg-primary text-white">
                  %
                </span>
              </div>
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
            aria-label={editingFabricId ? " Update Fabric" : "Save Fabric"}
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
                {editingFabricId ? "Update Fabric" : "Save Fabric"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FabricTable;
