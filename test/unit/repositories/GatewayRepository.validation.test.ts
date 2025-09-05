import { GatewayRepository } from "@repositories/GatewayRepository";
import { AppDataSource } from "@database";
import { BadRequestError } from "@errors/BadRequestError";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";

describe("GatewayRepository", () => {
    let repo: GatewayRepository;
    let network: NetworkDAO;

    beforeAll(async () => {
        await AppDataSource.initialize();
    });

    afterAll(async () => {
        await AppDataSource.destroy();
    });

    beforeEach(async () => {
        repo = new GatewayRepository();

        const gatewayRepo = AppDataSource.getRepository(GatewayDAO);
        const networkRepo = AppDataSource.getRepository(NetworkDAO);

        await gatewayRepo.clear();
        await networkRepo.clear();

        network = new NetworkDAO();
        network.code = "NET001TEST";
        network.name = "Test Network";
        await networkRepo.save(network);
    });

    it("should throw conflict if new_macAddress is already in use in the same network", async () => {
        await repo.createGateway("AA:BB:CC:DD:EE:01", "Gateway1", "Test", network.code);
        await repo.createGateway("AA:BB:CC:DD:EE:02", "Gateway2", "Test", network.code);

        await expect(
            repo.updateGateway(
                "AA:BB:CC:DD:EE:02",
                "AA:BB:CC:DD:EE:01",
                "Updated Name",
                "Updated Description",
                network.code
            )
        ).rejects.toThrow("Gateway with MacAddress 'AA:BB:CC:DD:EE:01' already in use");
    });

    it("should throw BadRequestError if no update fields are provided", async () => {
        const mac = "AA:BB:CC:DD:EE:03";
        await repo.createGateway(mac, "Gateway3", "Description", network.code);

        await expect(
            repo.updateGateway(mac, undefined, undefined, undefined, network.code)
        ).rejects.toThrow(BadRequestError);

        await expect(
            repo.updateGateway(mac, undefined, undefined, undefined, network.code)
        ).rejects.toThrow("Invalid gateway update");
    });

    it("should throw BadRequestError if gateway data is invalid during creation", async () => {
        const invalidMac = "";
        const invalidName = "";

        await expect(
            repo.createGateway(invalidMac, invalidName, "Some Description", network.code)
        ).rejects.toThrow(BadRequestError);

        await expect(
            repo.createGateway(invalidMac, invalidName, "Some Description", network.code)
        ).rejects.toThrow(/Invalid gateway data/);
    });

    it("should throw conflict if MAC address already exists during creation", async () => {
        const mac = "AA:BB:CC:DD:EE:04";

        await repo.createGateway(mac, "Gateway Original", "Description", network.code);

        await expect(
            repo.createGateway(mac, "Another Gateway", "Another Desc", network.code)
        ).rejects.toThrow(`Gateway with MAC address '${mac}' already exists`);
    });
});
