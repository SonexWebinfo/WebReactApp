import React, { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../../services/api";
import { Helmet } from "react-helmet-async";
import { debounce } from "lodash";
import { Modal, Button } from "react-bootstrap";
import { toast } from 'react-toastify';
import Select from "react-select";

// Reusable Spinner Component
const Spinner = ({ message = "Loading..." }) => (
  <div className="d-flex justify-content-center align-items-center p-5">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">{message}</span>
    </div>
  </div>
);

export const SupplierTable = () => {
  const [supplierData, setSupplierData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [filteredCityOptions, setFilteredCityOptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [supplierTypeOptions, setSupplierTypeOptions] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
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

  // Centralized error handling
  const handleApiError = (error, defaultMessage) => {
    console.error("API Error:", error);
    toast.error(error.response?.data?.message || defaultMessage);
  };

  const fetchStateOptions = async () => {
    try {
      const response = await api.get("/api/get-states");
      if (response.data && Array.isArray(response.data)) {
        const formattedStates = response.data.map((state) => ({
          value: state.id,
          label: state.name,
        }));
        setStateOptions(formattedStates);
      } else {
        toast.error("Failed to load states.");
      }
    } catch (error) {
      handleApiError(error, "Error fetching states.");
    }
  };

  const fetchCityOptions = async () => {
    try {
      const response = await api.get("/api/get-cities");
      if (response.data && Array.isArray(response.data)) {
        const formattedCities = response.data.map((city) => ({
          value: city.id,
          label: city.name,
          stateId: city.state_id,
        }));
        setCityOptions(formattedCities);
      } else {
        toast.error("Failed to load cities.");
      }
    } catch (error) {
      handleApiError(error, "Error fetching cities.");
    }
  };

  const fetchsupplierTypeOptions = async () => {
    try {
      const response = await api.get("/api/get-supplier-type");
      if (response.data && Array.isArray(response.data)) {
        const formattedType = response.data.map((type) => ({
          value: type.id,
          label: type.name,
        }));
        setSupplierTypeOptions(formattedType);
      } else {
        toast.error("Failed to load supplier.");
      }
    } catch (error) {
      handleApiError(error, "Error fetching supplier types.");
    }
  };

  const fetchsupplierData = useCallback(
    async (page = 1, search = "", perPageCount = perPage) => {
      setPageLoading(true);
      try {
        const response = await api.get("/api/fetch-supplier-table-data", {
          params: {
            page,
            search,
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

        setSupplierData(data);
        setPagination({
          currentPage: response.data.pagination?.current_page || 1,
          lastPage: response.data.pagination?.last_page || 1,
          total: response.data.pagination?.total || data.length || 0,
          from: response.data.pagination?.from || 1,
          to: response.data.pagination?.to || data.length || 0,
        });
      } catch (error) {
        handleApiError(error, "Failed to fetch supplier data.");
        setSupplierData([]);
      } finally {
        setPageLoading(false);
      }
    },
    [perPage, handleApiError]
  );

  const [supplierForm, setSupplierForm] = useState({
    supplier_name: "",
    supplier_company_name: "",
    supplier_phone: "",
    supplier_email: "",
    supplier_address: "",
    supplier_state: "",
    supplier_city: "",
    supplier_pincode: "",
    supplier_gst_no: "",
    supplier_type_id: "",
  });

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchsupplierData(),
        fetchStateOptions(),
        fetchCityOptions(),
        fetchsupplierTypeOptions(),
      ]);
    } catch (error) {
      handleApiError(error, "Failed to load initial data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleStateChange = (selectedOption) => {
    setSupplierForm({
      ...supplierForm,
      supplier_state: selectedOption?.value || "",
      supplier_city: "",
    });
    const filteredCities = cityOptions.filter(
      (city) => city.stateId === selectedOption?.value
    );
    setFilteredCityOptions(filteredCities);
  };

  const handleCityChange = (selectedOption) => {
    setSupplierForm({
      ...supplierForm,
      supplier_city: selectedOption?.value || "",
    });
  };

  const handlesupplierTypeChange = (selectedOption) => {
    setSupplierForm({
      ...supplierForm,
      supplier_type_id: selectedOption?.value || "",
    });
  };

  const handleChange = (e) => {
    setSupplierForm({ ...supplierForm, [e.target.name]: e.target.value });
  };

  const handlePageChange = (page) => {
    if (
      page > 0 &&
      page <= pagination.lastPage &&
      page !== pagination.currentPage
    ) {
      fetchsupplierData(page, searchText);
    }
  };

  const validateForm = () => {
    const {
      supplier_name,
      supplier_company_name,
      supplier_phone,
      supplier_email,
      supplier_state,
      supplier_city,
      supplier_type_id,
      supplier_pincode,
    } = supplierForm;

    if (
      !supplier_name ||
      !supplier_company_name ||
      !supplier_phone ||
      !supplier_email ||
      !supplier_state ||
      !supplier_city ||
      !supplier_type_id
    ) {
      toast.warning("Please fill in all required fields.");
      return false;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(supplier_phone)) {
      toast.warning("Please enter a valid 10-digit phone number.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(supplier_email)) {
      toast.warning("Please enter a valid email address.");
      return false;
    }

    const pincodeRegex = /^\d{6}$/;
    if (supplier_pincode && !pincodeRegex.test(supplier_pincode)) {
      toast.warning("Please enter a valid 6-digit pincode.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const url = editingSupplierId
        ? `/api/update-supplier-data/${editingSupplierId}`
        : "/api/store-supplier-data";
      await api.post(url, supplierForm);
      toast.success(
        `Supplier ${editingSupplierId ? "updated" : "added"} successfully!`
      );
      fetchsupplierData(pagination.currentPage);
      setShowModal(false);
      resetForm();
    } catch (error) {
      const status = error.response?.status;
      if (status === 409) {
        handleApiError(error, "This supplier name already exists.");
      } else if (status === 422) {
        handleApiError(error, "Please fix the validation errors.");
      } else {
        handleApiError(error, "An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const editSupplier = async (supplierId) => {
    try {
      const response = await api.get(`/api/get-supplier-data/${supplierId}`);
      if (response.data?.data) {
        const stateId = response.data.data.state_id || "";
        const filteredCities = cityOptions.filter(
          (city) => city.stateId === stateId
        );
        setFilteredCityOptions(filteredCities);
        setSupplierForm({
          supplier_name: response.data.data.supplier_name || "",
          supplier_company_name: response.data.data.supplier_company_name || "",
          supplier_phone: response.data.data.supplier_phone || "",
          supplier_email: response.data.data.supplier_email || "",
          supplier_address: response.data.data.supplier_address || "",
          supplier_state: stateId,
          supplier_city: response.data.data.city_id || "",
          supplier_pincode: response.data.data.supplier_pincode || "",
          supplier_gst_no: response.data.data.supplier_gst_no || "",
          supplier_type_id: response.data.data.supplier_type_id || "",
        });
        setEditingSupplierId(supplierId);
        setShowModal(true);
      } else {
        handleApiError(null, "supplier data not found.");
      }
    } catch (error) {
      handleApiError(error, "Error fetching supplier data.");
    }
  };

  const deletesupplier = async (supplierId) => {
    if (!window.confirm("Are you sure you want to delete this supplier?"))
      return;

    try {
      const response = await api.delete(`/api/delete-supplier/${supplierId}`);
      if (response.status === 200) {
        toast.success("supplier deleted successfully!");
        setSupplierData((prevData) =>
          prevData.filter((supplier) => supplier.supplier_id !== supplierId)
        );
      } else {
        handleApiError(null, "Failed to delete supplier.");
      }
    } catch (error) {
      handleApiError(error, "Error deleting supplier.");
    }
  };

  const debouncedFetchsupplierData = useMemo(
    () =>
      debounce((page, search, perPageCount) => {
        fetchsupplierData(page, search, perPageCount);
      }, 500),
    [fetchsupplierData]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value.trim();
    setSearchText(value);
    debouncedFetchsupplierData(1, value, perPage);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const clearSearch = () => {
    setSearchText("");
    fetchsupplierData(1, "", perPage);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleShow = () => {
    setShowModal(true);
  };

  const resetForm = () => {
    setSupplierForm({
      supplier_name: "",
      supplier_phone: "",
      supplier_email: "",
      supplier_address: "",
      supplier_state: "",
      supplier_city: "",
      supplier_pincode: "",
      supplier_gst_no: "",
      supplier_type_id: "",
    });
    setFilteredCityOptions([]);
    setEditingSupplierId(null);
  };

  return (
    <>
      <Helmet>
        <title>ERP | supplier Master</title>
      </Helmet>
      <div className="card">
        <h5 className="card-header d-flex justify-content-between align-items-center flex-wrap">
          <span>Basic Info supplier Details</span>
          <div className="btn-group mt-2 mt-md-0">
            <button
              aria-label="Manage supplier"
              type="button"
              className="btn btn-primary btn-sm dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="bx bx-user"></i>&nbsp;Manage supplier
            </button>
            <ul className="dropdown-menu">
              <li>
                <button
                  aria-label="Add supplier"
                  className="dropdown-item"
                  onClick={handleShow}
                >
                  <i className="bx bx-user"></i> Add supplier
                </button>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <a
                  aria-label="Import supplier"
                  className="dropdown-item"
                  href="#"
                >
                  <i className="bx bx-cloud-upload"></i> Import
                </a>
              </li>
              <li>
                <a
                  aria-label="Export supplier"
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
                fetchsupplierData(1, searchText, value);
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
              placeholder="Search supplier Name"
              value={searchText}
              onChange={handleSearchChange}
              aria-label="Search supplier Name"
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
            <Spinner message="Loading..." />
          ) : supplierData.length > 0 ? (
            <>
              <table className="table table-hover text-nowrap">
                <thead className="table-light">
                  <tr>
                    <th className="text-center">Sr.</th>
                    <th>supplier</th>
                    <th>Company</th>
                    <th>Phone No</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>supplier Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageLoading ? (
                    <tr>
                      <td colSpan="8" className="text-center p-5">
                        <Spinner message="Loading..." />
                      </td>
                    </tr>
                  ) : supplierData.length > 0 ? (
                    supplierData.map((supplier, index) => (
                      <tr key={supplier.supplier_id || index}>
                        <td className="text-center">{index + 1}</td>
                        <td>{supplier.supplier_name || "N/A"}</td>
                        <td>{supplier.supplier_company_name || "N/A"}</td>
                        <td>{supplier.supplier_phone || "N/A"}</td>
                        <td>{supplier.supplier_email || "N/A"}</td>
                        <td>{supplier.city || "N/A"}</td>
                        <td>{supplier.type_name || "N/A"}</td>
                        <td>
                          <div className="dropdown">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm dropdown-toggle hide-arrow"
                              data-bs-toggle="dropdown"
                              aria-label="supplier Actions"
                            >
                              <i className="bx bx-down-arrow-circle"></i>
                            </button>
                            <div className="dropdown-menu">
                              <button
                                className="dropdown-item ms-2"
                                onClick={() =>
                                  editSupplier(supplier.supplier_id)
                                }
                                aria-label="Edit supplier"
                              >
                                <i className="bx bx-edit-alt"></i> Edit
                              </button>
                              <button
                                className="dropdown-item ms-2"
                                onClick={() =>
                                  deletesupplier(supplier.supplier_id)
                                }
                                aria-label="Delete supplier"
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
                      <td colSpan="8" className="text-center">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <hr className="mt-0 mb-0 shadow-sm" />
              {pagination.total > 0 && (
                <div className="d-flex justify-content-end align-items-center gap-2 mb-1 pt-3 me-2">
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
        onHide={() => {
          setShowModal(false);
          resetForm();
        }}
        aria-labelledby="supplierModalTitle"
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="supplierModalTitle">
            {editingSupplierId ? "Edit supplier" : "Create supplier"}
          </Modal.Title>
        </Modal.Header>
        <hr className="mt-0 mb-0 shadow-sm" />
        <Modal.Body>
          <div className="row g-2">
            <div className="col-md-6 mb-1">
              <label className="form-label" htmlFor="supplier_name">
                supplier Name <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type="text"
                  name="supplier_name"
                  id="supplier_name"
                  value={supplierForm.supplier_name}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter supplier Name"
                  required
                  aria-required="true"
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bx-user"></i>
                </span>
              </div>
            </div>
            <div className="col-md-6 mb-1">
              <label className="form-label" htmlFor="supplier_company_name">
                Company Name <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type="text"
                  name="supplier_company_name"
                  id="supplier_company_name"
                  value={supplierForm.supplier_company_name}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Company Name"
                  required
                  aria-required="true"
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bx-buildings"></i>
                </span>
              </div>
            </div>
            <div className="col-md-6 mb-1">
              <label className="form-label" htmlFor="supplier_phone">
                Phone No <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type="text"
                  name="supplier_phone"
                  id="supplier_phone"
                  value={supplierForm.supplier_phone}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Phone No"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  required
                  aria-required="true"
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bx-phone"></i>
                </span>
              </div>
            </div>
            <div className="col-md-6 mb-1">
              <label className="form-label" htmlFor="supplier_email">
                Email <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type="email"
                  name="supplier_email"
                  id="supplier_email"
                  value={supplierForm.supplier_email}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Email Address"
                  required
                  aria-required="true"
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bx-envelope"></i>
                </span>
              </div>
            </div>
            <div className="col-md-12 mb-1">
              <label className="form-label" htmlFor="supplier_address">
                Address <span className="text-danger">*</span>
              </label>
              <textarea
                name="supplier_address"
                id="supplier_address"
                value={supplierForm.supplier_address}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter Address"
                rows="2"
                required
                aria-required="true"
              ></textarea>
            </div>
            <div className="col-md-4 mb-1">
              <label className="form-label" htmlFor="supplier_state">
                State <span className="text-danger">*</span>
              </label>
              <Select
                options={stateOptions}
                value={stateOptions.find(
                  (option) => option.value === supplierForm.supplier_state
                )}
                onChange={handleStateChange}
                placeholder="Select State"
                isClearable
                inputId="supplier_state"
                aria-required="true"
              />
            </div>
            <div className="col-md-4 mb-1">
              <label className="form-label" htmlFor="supplier_city">
                City <span className="text-danger">*</span>
              </label>
              <Select
                options={filteredCityOptions}
                value={filteredCityOptions.find(
                  (option) => option.value === supplierForm.supplier_city
                )}
                onChange={handleCityChange}
                placeholder="Select City"
                isClearable
                inputId="supplier_city"
                aria-required="true"
              />
            </div>
            <div className="col-md-4 mb-1">
              <label className="form-label" htmlFor="supplier_pincode">
                Pincode
              </label>
              <div className="input-group">
                <input
                  type="text"
                  name="supplier_pincode"
                  id="supplier_pincode"
                  value={supplierForm.supplier_pincode}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Pincode"
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bx-map-pin"></i>
                </span>
              </div>
            </div>
            <div className="col-md-4 mb-1">
              <label className="form-label" htmlFor="supplier_gst_no">
                GST No
              </label>
              <div className="input-group">
                <input
                  type="text"
                  name="supplier_gst_no"
                  id="supplier_gst_no"
                  value={supplierForm.supplier_gst_no}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter GST No"
                  maxLength={15}
                  pattern="[0-9A-Z]{15}"
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bxs-dice-2"></i>
                </span>
              </div>
            </div>
            <div className="col-md-4 mb-1">
              <label className="form-label" htmlFor="supplier_type_id">
                Select Type <span className="text-danger">*</span>
              </label>
              <Select
                options={supplierTypeOptions}
                value={supplierTypeOptions.find(
                  (option) => option.value === supplierForm.supplier_type_id
                )}
                onChange={handlesupplierTypeChange}
                placeholder="Search or select type"
                isClearable
                isSearchable
                inputId="supplier_type_id"
                className={!supplierForm.supplier_type_id ? "is-invalid" : ""}
                aria-required="true"
              />
            </div>
          </div>
        </Modal.Body>
        <hr className="mt-0 mb-0 shadow-sm" />
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
            aria-label="Close Modal"
          >
            <i className="bx bx-window-close"></i> Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            aria-label={editingSupplierId ? "Update supplier" : "Save supplier"}
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
                {editingSupplierId ? "Update supplier" : "Save supplier"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SupplierTable;
