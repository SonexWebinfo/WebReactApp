import React, { useState } from "react";
import { Card } from "react-bootstrap";

export const JobWorkProduction = () => {
    const [activeTab, setActiveTab] = useState("coating");

    const handleTabClick = (tab) => setActiveTab(tab);

    return (
        <div className="col-md-12 mb-4">
            <Card className="shadow-sm border-0">
                <h5 className="card-header bg-white fw-semibold text-center">
                    Job Work & Production
                </h5>

                {/* Tabs Header */}
                <div className="card-body border-bottom pb-0">
                    <ul
                        className="nav nav-tabs justify-content-center mb-3 border-0 flex-wrap"
                        style={{ gap: "1rem" }}
                    >
                        <li className="nav-item">
                            <button
                                className={`nav-link fw-semibold px-4 py-2 rounded-pill ${activeTab === "coating"
                                    ? "active bg-primary text-white shadow-sm"
                                    : "text-primary border border-primary bg-transparent"
                                    }`}
                                onClick={() => handleTabClick("coating")}
                            >
                                <i className="bx bx-home me-1"></i> Coating Gray
                            </button>
                        </li>

                        <li className="nav-item">
                            <button
                                className={`nav-link fw-semibold px-4 py-2 rounded-pill ${activeTab === "embroidary"
                                    ? "active bg-primary text-white shadow-sm"
                                    : "text-primary border border-primary bg-transparent"
                                    }`}
                                onClick={() => handleTabClick("embroidary")}
                            >
                                <i className="bx bx-info-circle me-1"></i> Embroidery
                            </button>
                        </li>

                        <li className="nav-item">
                            <button
                                className={`nav-link fw-semibold px-4 py-2 rounded-pill ${activeTab === "printing"
                                    ? "active bg-primary text-white shadow-sm"
                                    : "text-primary border border-primary bg-transparent"
                                    }`}
                                onClick={() => handleTabClick("printing")}
                            >
                                <i className="bx bx-printer me-1"></i> Printing
                            </button>
                        </li>

                        <li className="nav-item">
                            <button
                                className={`nav-link fw-semibold px-4 py-2 rounded-pill ${activeTab === "mill"
                                    ? "active bg-primary text-white shadow-sm"
                                    : "text-primary border border-primary bg-transparent"
                                    }`}
                                onClick={() => handleTabClick("mill")}
                            >
                                <i className="bx bx-building me-1"></i> Mill
                            </button>
                        </li>

                        <li className="nav-item">
                            <button
                                className={`nav-link fw-semibold px-4 py-2 rounded-pill ${activeTab === "finish"
                                    ? "active bg-primary text-white shadow-sm"
                                    : "text-primary border border-primary bg-transparent"
                                    }`}
                                onClick={() => handleTabClick("finish")}
                            >
                                <i className="bx bx-check-circle me-1"></i> Finish
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Tab Content */}
                <div className="card-body text-center">
                    {activeTab === "coating" && (
                        <div>
                            <h6 className="fw-semibold mb-2 text-primary">
                                Coating Gray Section
                            </h6>
                            <p className="text-muted mb-0">
                                Add coating gray production data or UI components here.
                            </p>
                        </div>
                    )}

                    {activeTab === "embroidary" && (
                        <div>
                            <h6 className="fw-semibold mb-2 text-primary">
                                Embroidery Section
                            </h6>
                            <p className="text-muted mb-0">
                                Add embroidery-related UI or process details here.
                            </p>
                        </div>
                    )}

                    {activeTab === "printing" && (
                        <div>
                            <h6 className="fw-semibold mb-2 text-primary">Printing Section</h6>
                            <p className="text-muted mb-0">
                                Manage printing data and production here.
                            </p>
                        </div>
                    )}

                    {activeTab === "mill" && (
                        <div>
                            <h6 className="fw-semibold mb-2 text-primary">Mill Section</h6>
                            <p className="text-muted mb-0">
                                Add mill process data and operations here.
                            </p>
                        </div>
                    )}

                    {activeTab === "finish" && (
                        <div>
                            <h6 className="fw-semibold mb-2 text-primary">Finish Section</h6>
                            <p className="text-muted mb-0">
                                Add finishing process UI or data here.
                            </p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default JobWorkProduction;
