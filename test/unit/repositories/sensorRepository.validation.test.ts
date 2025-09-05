import { SensorRepository } from "@repositories/SensorRepository";
import { AppDataSource } from "@database";
import { BadRequestError } from "@errors/BadRequestError";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";

jest.mock("@database", () => ({
    AppDataSource: {
        getRepository: jest.fn()
    }
}));

const mockSensorRepo = {
    create: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn()
};

const mockNetworkRepo = {
    find: jest.fn()
};

const mockGatewayRepo = {
    find: jest.fn()
};

let repo: SensorRepository;

beforeEach(() => {
    (AppDataSource.getRepository as jest.Mock).mockImplementation((dao) => {
        if (dao === SensorDAO) return mockSensorRepo;
        if (dao === NetworkDAO) return mockNetworkRepo;
        if (dao === GatewayDAO) return mockGatewayRepo;
    });

    repo = new SensorRepository(); // <-- va istanziato DOPO il mock
});

function createMockSensorDAO(overrides = {}): SensorDAO {
    return {
        id: 1,
        macAddress: "mac",
        name: "Sensor 1",
        description: "Test sensor",
        variable: "temperature",
        unit: "°C",
        gateway: {
            id: 1,
            macAddress: "GW1",
            network: { id: 1 }
        },
        ...overrides
    } as SensorDAO;
}

describe("SensorRepository validation", () => {
    test("should throw BadRequestError if sensor validation fails", async () => {
        mockNetworkRepo.find.mockResolvedValue([{ id: 1 }]);
        mockGatewayRepo.find.mockResolvedValue([{ macAddress: "GW1", network: { id: 1 } }]);

        mockSensorRepo.create.mockReturnValue({}); // serve anche se non usato direttamente

        jest.spyOn(require("class-validator"), "validate").mockResolvedValue([
            { constraints: { isNotEmpty: "name should not be empty" } }
        ]);

        await expect(
            repo.createSensor("mac", "", "", "", "", "net1", "GW1")
        ).rejects.toThrow(BadRequestError);
    });

    test("should throw ConflictError if new MAC address already exists", async () => {
        mockNetworkRepo.find.mockResolvedValue([{ id: 1 }]);
        mockGatewayRepo.find.mockResolvedValue([{ macAddress: "GW1", network: { id: 1 } }]);

        mockSensorRepo.find.mockResolvedValue([
            createMockSensorDAO({ macAddress: "new-mac" })
        ]);

        jest.spyOn(repo, "getSensorByMacAddress").mockResolvedValue(
            createMockSensorDAO({ macAddress: "old-mac" })
        );

        await expect(
            repo.updateSensor("old-mac", "new-mac", "name", "desc", "var", "unit", "net1", "GW1")
        ).rejects.toThrow(/already in use/);
    });

    test("should throw BadRequestError if update has no changes", async () => {
        mockNetworkRepo.find.mockResolvedValue([{ id: 1 }]);
        mockGatewayRepo.find.mockResolvedValue([{ macAddress: "GW1", network: { id: 1 } }]);

        jest.spyOn(repo, "getSensorByMacAddress").mockResolvedValue(
            createMockSensorDAO()
        );

        await expect(
            repo.updateSensor("mac", undefined, undefined, undefined, undefined, undefined, "net1", "GW1")
        ).rejects.toThrow(BadRequestError);
    });
});
