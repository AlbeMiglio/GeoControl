import * as gatewayController from "@controllers/gatewayController"
import type { GatewayDAO } from "@dao/GatewayDAO"
import type { NetworkDAO } from "@dao/NetworkDAO"
import { GatewayRepository } from "@repositories/GatewayRepository"


jest.mock("@repositories/GatewayRepository")

describe("GatewayController integration", () => {
  it("get Gateway: mapperService integration", async () => {
      const fakeGatewayDAO = {
        macAddress: "94:3F:BE:4C:4A:79",
        name: "GW01",
        description: "on-field aggregation node",
        sensors: [
          {
            macAddress: "71:B1:CE:01:C6:A9",
            name: "TH01",
            description: "External thermometer",
            variable: "temperature",
            unit: "C",
          },
        ],
      };

      const expectedDTO = {
        macAddress: fakeGatewayDAO.macAddress,
        name: fakeGatewayDAO.name,
        description: fakeGatewayDAO.description,
        sensors: fakeGatewayDAO.sensors,
      };

    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      getGatewayByMacAddress: jest.fn().mockResolvedValue(fakeGatewayDAO),
    }));

    const result = await gatewayController.getGatewayByMacAddress("AA:BB:CC:DD:EE:FF", "NET001")

    expect(result).toEqual(expectedDTO)
  })

  it("get all Gateways by Network: mapperService integration", async () => {
    const networkDAO = {
      code: "NET001",
      name: "Test Network",
      description: "Test Location",
    }

    const fakeGatewayDAOs = [
      {
        macAddress: "AA:BB:CC:DD:EE:FF",
        name: "Gateway 1"
      },
      {
        macAddress: "11:22:33:44:55:66",
        name: "Gateway 2",
        network: networkDAO,
      },
    ]

    const expectedDTOs = fakeGatewayDAOs.map((dao) => ({
      macAddress: dao.macAddress,
      name: dao.name,
    }))
    ;(GatewayRepository as jest.Mock).mockImplementation(() => ({
      getAllGatewaysByNetwork: jest.fn().mockResolvedValue(fakeGatewayDAOs),
    }))

    const result = await gatewayController.getAllGatewaysByNetwork("NET001")

    expect(result).toEqual(expectedDTOs)
    expect(result).toHaveLength(2)
  })

  it("create Gateway: mapperService integration", async () => {
    const networkDAO  = {
      code: "NET001",
      name: "Test Network",
      description: "Test Location",
    }

    const newGatewayDAO = {
      macAddress: "AA:BB:CC:DD:EE:FF",
      name: "New Gateway",
      network: networkDAO,
    }

    const expectedDTO = {
      macAddress: newGatewayDAO.macAddress,
      name: newGatewayDAO.name,
    }
    ;(GatewayRepository as jest.Mock).mockImplementation(() => ({
      createGateway: jest.fn().mockResolvedValue(newGatewayDAO),
    }))

    const result = await gatewayController.createGateway(newGatewayDAO, "NET001")

    expect(result).toEqual(expectedDTO)
  })

  it("update Gateway: mapperService integration", async () => {
    const networkDAO = {
      code: "NET001",
      name: "Test Network",
      description: "Test Location",
    }

    const updatedGatewayDAO = {
      macAddress: "AA:BB:CC:DD:EE:FF",
      name: "Updated Gateway",
      network: networkDAO,
    }

    const expectedDTO = {
      macAddress: updatedGatewayDAO.macAddress,
      name: updatedGatewayDAO.name,
    }
    ;(GatewayRepository as jest.Mock).mockImplementation(() => ({
      updateGateway: jest.fn().mockResolvedValue(updatedGatewayDAO),
    }))

    const result = await gatewayController.updateGateway(updatedGatewayDAO, "AA:BB:CC:DD:EE:FF", "NET001")

    expect(result).toEqual(expectedDTO)
  })

  it("delete Gateway: mapperService integration", async () => {
    const macAddress = "AA:BB:CC:DD:EE:FF";

    const mockDelete = jest.fn().mockResolvedValue(true);
    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      deleteGateway: mockDelete,
    }));

    await gatewayController.deleteGateway(macAddress, "NET001")

    expect(mockDelete).toHaveBeenCalledWith(macAddress, "NET001");
    expect(mockDelete).toHaveBeenCalledTimes(1);
  })

  
})
