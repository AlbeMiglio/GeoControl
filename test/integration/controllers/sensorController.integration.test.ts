import * as sensorController from "@controllers/sensorController"
import type { SensorDAO } from "@dao/SensorDAO"
import type { GatewayDAO } from "@dao/GatewayDAO"
import type { NetworkDAO } from "@dao/NetworkDAO"
import { SensorRepository } from "@repositories/SensorRepository"


jest.mock("@repositories/SensorRepository")

describe("SensorController integration", () => {
  it("get Sensor: mapperService integration", async () => {
  const networkDAO: NetworkDAO = {
    id: 1,
    code: "NET001",
    name: "Test Network",
    description: "Test Location",
    gateways: [],
  };



    const gatewayDAO: GatewayDAO = {
      id: 1, 
      macAddress: "AA:BB:CC:DD:EE:FF",
      name: "Test Gateway",
      description: "Test Gateway Description",
      network: networkDAO,
      sensors: [], 
    }


   const fakeSensorDAO: SensorDAO = {
    id: 1,
    macAddress: "11:22:33:44:55:66",
    name: "Test Sensor",
    description: "Test Sensor Description",
    unit: "Celsius",
    variable: "temperature",
    measurements: [],
    gateway: gatewayDAO,
  }


    
    const expectedDTO = {
      macAddress: fakeSensorDAO.macAddress,
      name: fakeSensorDAO.name,
      variable: fakeSensorDAO.variable,
      unit: fakeSensorDAO.unit,
      description: fakeSensorDAO.description,
    };
     



    
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorByMacAddress: jest.fn().mockResolvedValue(fakeSensorDAO),
    }))

    const result = await sensorController.getSensorByMacAddress(
      "11:22:33:44:55:66",
      "NET001", 
      "AA:BB:CC:DD:EE:FF", 
    )


    expect(result).toEqual(expectedDTO)
  })

  it("get all Sensors by Gateway: mapperService integration", async () => {
          const networkDAO: NetworkDAO = {
            id: 1,
            code: "NET001",
            name: "Test Network",
            description: "Test Network Description",
            gateways: [],
          };

    const gatewayDAO: GatewayDAO = {
      id: 1,
      macAddress: "AA:BB:CC:DD:EE:FF",
      name: "Test Gateway",
      description: "Test Gateway Description",
      network: networkDAO,
      sensors: [],
    };

    
   const sensorDAOs: SensorDAO[] = [
      {
        id: 1,
        macAddress: "11:22:33:44:55:66",
        name: "Test Sensor 1",
        description: "Test Sensor Description",
        variable: "temperature",
        unit: "Celsius",
        gateway: gatewayDAO,
        measurements: [],
        
      },
      {
        id: 2,
        macAddress: "AA:BB:CC:DD:EE:00",
        name: "Test Sensor 2",
        description: "Test Sensor Description 2",
        variable: "humidity",
        unit: "Percent",
        gateway: gatewayDAO,
        measurements: [],
        
      },
    ];


    const expectedDTOs = sensorDAOs.map((dao) => ({
      macAddress: dao.macAddress,
      name: dao.name,
      description: dao.description,
      unit: dao.unit,
      variable: dao.variable,
    }));


    ;(SensorRepository as jest.Mock).mockImplementation(() => ({
      getAllSensorsByGateway: jest.fn().mockResolvedValue(sensorDAOs),
    }))

    const result = await sensorController.getAllSensorsByGateway("NET001", "AA:BB:CC:DD:EE:FF")


    expect(result).toEqual(expectedDTOs)
    expect(result).toHaveLength(2)
  })

  it("create Sensor: mapperService integration", async () => {
    const networkDAO: NetworkDAO = {
     id: 1,
      code: "NET001",
      name: "Test Network",
      description: "Test Location",
      gateways: [],
    }

    const gatewayDAO: GatewayDAO = {
      id: 1,
      macAddress: "AA:BB:CC:DD:EE:FF",
      name: "Test Gateway",
      description: "Test Gateway Description",
      network: networkDAO,
      sensors: [],
    }

    const newSensorDAO: SensorDAO = {
      id: 1,
      macAddress: "11:22:33:44:55:66",
      name: "Test Sensor",
      description: "Test Sensor Description",
      unit: "Celsius",
      variable: "temperature",
      measurements: [],
      gateway: gatewayDAO,
    };

    const expectedDTO = {
  macAddress: newSensorDAO.macAddress,
  name: newSensorDAO.name,
  description: newSensorDAO.description,
  variable: newSensorDAO.variable,
  unit: newSensorDAO.unit,
};



    (SensorRepository as jest.Mock).mockImplementation(() => ({
      createSensor: jest.fn().mockResolvedValue(newSensorDAO),
    }))
      const newSensorDTO= {
        macAddress: "11:22:33:44:55:66",
        name: "Test Sensor",
        variable: "temperature",
        unit: "Celsius",
      };


   const result = await sensorController.createSensor(newSensorDTO, "NET001", "AA:BB:CC:DD:EE:FF");


    expect(result).toEqual(expectedDTO)
  })

  it("get all Sensors by Gateway: mapperService integration with error", async () => {
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getAllSensorsByGateway: jest.fn().mockRejectedValue(new Error("Gateway not found")),
    }));

    await expect(sensorController.getAllSensorsByGateway("NET001", "AA:BB:CC:DD:EE:FF"))
      .rejects.toThrow("Gateway not found");
  });
  
  it("delete Sensor by MAC address: mapperService integration", async () => {
    const networkDAO: NetworkDAO = {
      id: 1,
      code: "NET001",
      name: "Test Network",
      description: "Test Location",
      gateways: [],
    };

    const gatewayDAO: GatewayDAO = {
      id: 1,
      macAddress: "AA:BB:CC:DD:EE:FF",
      name: "Test Gateway",
      description: "Test Gateway Description",
      network: networkDAO,
      sensors: [],
    };

    const sensorMacAddress = "11:22:33:44:55:66";

    (SensorRepository as jest.Mock).mockImplementation(() => ({
      deleteSensor: jest.fn().mockResolvedValue({ affected: 1 }),
    }));

    await expect(sensorController.deleteSensor(sensorMacAddress, "NET001", "AA:BB:CC:DD:EE:FF")).resolves.toBeUndefined();

  });
  it("update Sensor by MAC address: mapperService integration", async () => {
    const networkDAO: NetworkDAO = {
      id: 1,
      code: "NET001",
      name: "Test Network",
      description: "Test Location",
      gateways: [],
    };

    const gatewayDAO: GatewayDAO = {
      id: 1,
      macAddress: "AA:BB:CC:DD:EE:FF",
      name: "Test Gateway",
      description: "Test Gateway Description",
      network: networkDAO,
      sensors: [],
    };

    const updatedSensorDAO: SensorDAO = {
      id: 1,
      macAddress: "11:22:33:44:55:66",
      name: "Updated Sensor",
      description: "Updated Sensor Description",
      unit: "Celsius",
      variable: "temperature",
      measurements: [],
      gateway: gatewayDAO,
    };

    const expectedDTO = {
      macAddress: updatedSensorDAO.macAddress,
      name: updatedSensorDAO.name,
      description: updatedSensorDAO.description,
      variable: updatedSensorDAO.variable,
      unit: updatedSensorDAO.unit,
    };

    (SensorRepository as jest.Mock).mockImplementation(() => ({
      updateSensor: jest.fn().mockResolvedValue(updatedSensorDAO),
    }));

    const updatedSensorDTO = {
      macAddress: "11:22:33:44:55:66",
      name: "Updated Sensor",
      variable: "temperature",
      unit: "Celsius",
    };

    const result = await sensorController.updateSensor(updatedSensorDTO,"11:22:33:44:55:66", "NET001", "AA:BB:CC:DD:EE:FF");

    expect(result).toEqual(expectedDTO);
  });


  
})
