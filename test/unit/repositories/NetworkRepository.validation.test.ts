import { NetworkRepository } from "@repositories/NetworkRepository";
import { BadRequestError } from "@errors/BadRequestError";
import { validate } from "class-validator";
import { NetworkDAO } from "@dao/NetworkDAO";
import * as classValidator from "class-validator"

const mockFind = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();

jest.mock("@database", () => ({
    AppDataSource: {
        getRepository: () => ({
            find: mockFind,
            save: mockSave,
            remove: mockRemove,
        }),
    },
}));

jest.mock("class-validator", () => {
    const actual = jest.requireActual<any>("class-validator");
    return {
        ...actual,
        validate: jest.fn()
    };
});

describe("NetworkRepository – validation error branches", () => {
    let repo: NetworkRepository;

    beforeEach(() => {
        jest.clearAllMocks();
        repo = new NetworkRepository();
    });

    it("getNetworkByCode() - BadRequestError se validate restituisce errori", async () => {

        (validate as jest.Mock).mockResolvedValue([
            { constraints: { isAlphanumeric: "code must be alphanumeric" } }
        ]);


        await expect(repo.getNetworkByCode("!@#"))
            .rejects
            .toThrow(BadRequestError);

        await expect(repo.getNetworkByCode("!@#"))
            .rejects
            .toThrow(/Invalid network code/);
    });

    it("createNetwork() - Missing required fields se code è vuoto", async () => {

        await expect(repo.createNetwork("", "Name", "Desc", []))
            .rejects
            .toThrow(BadRequestError);
        await expect(repo.createNetwork("", "Name", "Desc", []))
            .rejects
            .toThrow(/Missing required fields/);
    });

    it("createNetwork throws BadRequestError with detailed joined message", async () => {

        mockFind.mockResolvedValue([]);


        (classValidator.validate as jest.Mock).mockResolvedValueOnce([
            { constraints: { minLength: "name too short" } },
            { constraints: { maxLength: "description too long" } }
        ]);


        await expect(repo.createNetwork("NETX", "X", "D".repeat(300), []))
            .rejects
            .toThrow(BadRequestError);

        await expect(repo.createNetwork("NETX", "X", "D".repeat(300), []))
            .rejects
            .toThrow("Invalid network data: 'code must be alphanumeric'");
    });

    it("deleteNetwork() - BadRequestError se validate restituisce errori", async () => {

        (validate as jest.Mock).mockResolvedValue([
            { constraints: { isAlphanumeric: "invalid code" } }
        ]);

        await expect(repo.deleteNetwork("!!!"))
            .rejects
            .toThrow(BadRequestError);

        await expect(repo.deleteNetwork("!!!"))
            .rejects
            .toThrow(/Invalid network code/);
    });

    it("updateNetwork() - BadRequestError se non passo nulla da aggiornare", async () => {

        const fakeDao = Object.assign(new NetworkDAO(), {
            code: "NET1",
            name: "Name",
            description: "Desc",
            gateways: []
        });
        jest.spyOn(repo, "getNetworkByCode").mockResolvedValue(fakeDao);

        await expect(

            (repo.updateNetwork as any)("NET1", undefined, undefined, undefined)
        ).rejects.toThrow(BadRequestError);

        await expect(
            (repo.updateNetwork as any)("NET1", undefined, undefined, undefined)
        ).rejects.toThrow(/Invalid network update/);
    });
});
