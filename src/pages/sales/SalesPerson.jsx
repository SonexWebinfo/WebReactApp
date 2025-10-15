import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { Helmet } from "react-helmet-async";
import { api } from "../../services/api";

export const SalesPerson = () => {
    const [fabricOptions, setFabricOptions] = useState([]);
    const [designOptions, setDesignOptions] = useState([]);

    const [selectedFabric, setSelectedFabric] = useState(null);
    const [selectedDesign, setSelectedDesign] = useState(null);

    const [fabricCost, setFabricCost] = useState(0);
    const [designRate, setDesignRate] = useState(0);

    useEffect(() => {
        api.get('/api/get-fabric-data')
            .then(response => {
                const rawOptions = Array.isArray(response.data)
                    ? response.data
                    : Array.isArray(response.data?.data)
                        ? response.data.data
                        : [];

                const options = rawOptions.map(item => ({
                    value: item.fabric_id,
                    label: item.fabric_name,
                    cost: item.cost_price || 0 // assuming `cost` is the property name
                }));
                setFabricOptions(options);
            })
            .catch(console.error);

        api.get('/api/get-design-data')
            .then(response => {
                const designData = Array.isArray(response.data)
                    ? response.data
                    : Array.isArray(response.data?.data)
                        ? response.data.data
                        : [];

                const options = designData.map(design => ({
                    value: design.design_id,
                    label: design.design_name,
                    rate: design.rate || 0 // assuming `rate` is the property name
                }));
                setDesignOptions(options);
            })
            .catch(console.error);
    }, []);

    const handleFabricChange = (selected) => {
        setSelectedFabric(selected);
        setFabricCost(selected?.cost || 0);
    };

    const handleDesignChange = (selected) => {
        setSelectedDesign(selected);
        setDesignRate(selected?.rate || 0);
    };

    const salesCost = parseFloat(fabricCost || 0) + parseFloat(designRate || 0);

    return (
        <div className='card'>
            <Helmet>
                <title>ERP | Rate Calculator</title>
            </Helmet>
            <div className='card-header mb-0'>
                <h6 className='card-title mb-3 fw-bold'>Basic info Fabric & Design Rate Calculator</h6>
                <div className='row'>
                    <div className='col-md-6 col-xl-12'>
                        <div className='card shadow border border-primary mb-0'>
                            <div className='card-body'>
                                <div className='row'>
                                    <div className='col-md-3'>
                                        <label htmlFor='fabric' className='form-label'>Fabric</label>
                                        <Select
                                            options={fabricOptions}
                                            value={selectedFabric}
                                            onChange={handleFabricChange}
                                            placeholder="Search for a Fabric"
                                        />
                                    </div>
                                    <div className='col-md-3'>
                                        <label htmlFor='design' className='form-label'>Design</label>
                                        <Select
                                            options={designOptions}
                                            value={selectedDesign}
                                            onChange={handleDesignChange}
                                            placeholder="Search for a Design"
                                        />
                                    </div>

                                    <div className='col-md-2 d-none'>
                                        <label className='form-label'>Fabric Cost</label>
                                        <div className="input-group">
                                            <input
                                                type='text'
                                                className='form-control'
                                                value={fabricCost}
                                                readOnly
                                            />

                                            <span className="input-group-text bg-primary text-white fw-bold">₹</span>
                                        </div>
                                    </div>
                                    <div className='col-md-2 d-none'>
                                        <label className='form-label'>Design Rate</label>
                                        <div className="input-group">
                                            <input
                                                type='text'
                                                className='form-control'
                                                value={designRate}
                                                readOnly
                                            />

                                            <span className="input-group-text bg-primary text-white fw-bold">₹</span>
                                        </div>
                                    </div>
                                    <div className='col-md-2'>
                                        <label className='form-label'>Sales Cost</label>
                                        <div className="input-group">
                                            <input
                                                type='text'
                                                className='form-control bg-primary-subtle fw-bold'
                                                value={salesCost}
                                                readOnly
                                            />

                                            <span className="input-group-text bg-primary text-white fw-bold">₹</span>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesPerson;
