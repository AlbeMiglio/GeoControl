import * as networkController from "@controllers/networkController";
import type { NetworkDAO } from "@dao/NetworkDAO";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { mapNetworkDAOToDTO } from "@services/mapperService";

jest.mock("@repositories/NetworkRepository");
jest.mock("@services/mapperService");  

describe("NetworkController integration", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

      it("get Network: mapperService integration", async () => {
         const fakeNetworkDAO: NetworkDAO = {
          id: 1,
          code: "NET001",
          name: "Test Network",
          description: "Descrizione di test",
          gateways: [
            {
              id: 10,                    
              macAddress: "MAC001",
              name: "Gateway 1",
              description: "Gateway di prova",
              network: undefined,        
              sensors: []
            }
          ]
        };
  
        
      
          const expectedDTO = {
          code: "NET001",
          name: "Test Network",
          description: "Descrizione di test",
          gateways: [
            {
              macAddress: "MAC001",
              name: "Gateway 1",
              description: "Gateway di prova",
              sensors: []
            }
          ]
        };


    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getNetworkByCode: jest.fn().mockResolvedValue(fakeNetworkDAO),
    }));

                  (mapNetworkDAOToDTO as jest.Mock).mockImplementation((dao) => ({
            code: dao.code,
            name: dao.name,
            description: dao.description,
            gateways: dao.gateways?.map(gw => ({
              macAddress: gw.macAddress,
              name: gw.name,
              description: gw.description,
              sensors: gw.sensors?.map(sensor => ({
                macAddress: sensor.macAddress,
                name: sensor.name,
                description: sensor.description,
                unit: sensor.unit,
                variable: sensor.variable,
              })) ?? [],
            })) ?? [],
          }));



    const result = await networkController.getNetworkByCode("NET001");

    expect(result).toEqual(expectedDTO);
  });

  it("get all Networks: mapperService integration", async () => {
    const fakeNetworkDAOs: NetworkDAO[] = [
      {
        id: 1,
        code: "NET001",
        name: "Test Network",
        description: "Descrizione di test",
        gateways: []
      },
      {
        id: 2,
        code: "NET002",
        name: "Test Network 2",
        description: "DESCRIZIONE DI TEST",
        gateways: []
      },
    ];

    const expectedDTOs = fakeNetworkDAOs.map((dao) => ({
      code: dao.code,
      name: dao.name,
      description: dao.description,
      gateways: dao.gateways?.map(gw => ({
        macAddress: gw.macAddress,
        name: gw.name,
        description: gw.description,
        sensors: gw.sensors?.map(sensor => ({
          macAddress: sensor.macAddress,
          name: sensor.name,
          description: sensor.description,
          unit: sensor.unit,
          variable: sensor.variable,
        })) ?? [],
      })) ?? [],
    }));

    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getAllNetworks: jest.fn().mockResolvedValue(fakeNetworkDAOs),
    }));

    (mapNetworkDAOToDTO as jest.Mock).mockImplementation(dao => ({
      code: dao.code,
      name: dao.name,
      description: dao.description,
      gateways: dao.gateways?.map(gw => ({
        macAddress: gw.macAddress,
        name: gw.name,
        description: gw.description,
        sensors: gw.sensors?.map(sensor => ({
          macAddress: sensor.macAddress,
          name: sensor.name,
          description: sensor.description,
          unit: sensor.unit,
          variable: sensor.variable,
        })) ?? [],
      })) ?? [],
    }));

    const result = await networkController.getAllNetworks();

    expect(result).toEqual(expectedDTOs);
    expect(result).toHaveLength(2);
  });

  it("create Network: mapperService integration", async () => {
    const newNetworkDAO: NetworkDAO = {
      id: 1,
      code: "NET001",
      name: "New Network",
      description: "Creating a new network",
      gateways: []
    };

    const expectedDTO = {
      code: newNetworkDAO.code,
      name: newNetworkDAO.name,
      description: newNetworkDAO.description,
    };

    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      createNetwork: jest.fn().mockResolvedValue(newNetworkDAO),
    }));

    (mapNetworkDAOToDTO as jest.Mock).mockImplementation(dao => ({
      code: dao.code,
      name: dao.name,
      description: dao.description,
    }));

    const result = await networkController.createNetwork({
      code: "NET001",
      name: "New Network",
      description: "Creating a new network",
      gateways: [],
    });

    expect(result).toEqual(expectedDTO);
  });

  it("update Network: mapperService integration", async () => {
    const updatedNetworkDAO: NetworkDAO = {
      id: 1,
      code: "NET001",
      name: "Updated Network",
      description: "Updating the network",
      gateways: []
    };

    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      updateNetwork: jest.fn().mockResolvedValue(updatedNetworkDAO),
    }));

    
    await expect(networkController.updateNetwork({
      code: "NET001",
      name: "Updated Network",
      description: "Updating the network",
      gateways: [],
    }, "NET001")).resolves.toBeUndefined();
  });

  it("delete Network: mapperService integration", async () => {
    const codeToDelete = "NET001";

    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      deleteNetwork: jest.fn().mockResolvedValue(undefined),
    }));

    await expect(networkController.deleteNetwork(codeToDelete)).resolves.toBeUndefined();
  });

});
