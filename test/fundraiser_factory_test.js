const FundraiserFactoryContract = artifacts.require("FundraiserFactory");
const FundraiserContract = artifacts.require("Fundraiser");

contract("FundraiserFactory: deployment", () => {
    it("has been deployed", async () => {
        const fundraiserFactory = FundraiserFactoryContract.deployed();
        assert(fundraiserFactory, "fundraiser factory was not deployed");
    });
});

contract("FundraiserFactory: createFundraiser", (accounts) => {
    let fundraiserFactory;
    // fundraiser args
    const name = "Beneficiary Name";
    const url = "beneficiaryname.org";
    const imageURL = "https://placekitten.com/600/350" 
    const description = "Beneficiary Description"
    const beneficiary = accounts[1];
    
    // bağış sayısını 1 arttırıyor
    it("increments the fundraisersCount", async () => {
        // contractı deploy ediyoruz
        fundraiserFactory = await FundraiserFactoryContract.deployed();
        // fundraiserCount ile bağış sayısını istiyoruz
        const currentFundraisersCount = await fundraiserFactory.fundraisersCount();    
        // createFundraiser ile bağış oluşturuyoruz
        await fundraiserFactory.createFundraiser(
            name,
            url,
            imageURL,
            description,
            beneficiary
        );
        // fundraiserCount ile yeni bağış sayısını istiyoruz
        const newFundraisersCount = await fundraiserFactory.fundraisersCount();
        // Eğer newFundraiserCount, currentFundraisersCount dan 1 büyükse işlem doğrudur
        assert.equal(
            newFundraisersCount - currentFundraisersCount,
            1,
            "should increment by 1"
        )   
    });

    // FundraiserFactory.sol deki FundraiserCreated eventini çağıracağız
    it("emits the FundraiserCreated event", async () => { 
        // FundraiserFactory contractını deployluyoruz
        fundraiserFactory = await FundraiserFactoryContract.deployed();
        // tx = transaction / transaction datalarını FundraiserFactory contaractındaki createFundraiser fonksiyonu ile çağırıyoruz 
        const tx = await fundraiserFactory.createFundraiser(
            name,
            url,
            imageURL,
            description,
            beneficiary
        );
        const expectedEvent = "FundraiserCreated";  
        const actualEvent = tx.logs[0].event;
        assert.equal(
            actualEvent,
            expectedEvent,
            "events should match"
        );      
    });
});

contract("FundraiserFactory: fundraisers", (accounts) => {
    async function createFundraiserFactory(fundraiserCount, accounts) {
        // factory = contract 
        const factory = await FundraiserFactoryContract.new();
        // addFundraisers fonksiyonunu çağırdık 
        await addFundraisers(factory, fundraiserCount, accounts); 
        return factory;
    }

    async function addFundraisers(factory, count, accounts) {
        const name = "Beneficiary";
        const lowerCaseName = name.toLowerCase(); 
        const beneficiary = accounts[1];
        
        for (let i=0; i < count; i++) {
            await factory.createFundraiser(
        // create a series of fundraisers. The index will be used 
        // to make them each unique
            `${name} ${i}`,
            `${lowerCaseName}${i}.com`,
            `${lowerCaseName}${i}.png`,
            `Description for ${name} ${i}`,
            beneficiary
            ); 
        }
    }

    describe("when fundraisers collection is empty", () => {
        it("returns an empty collection", async () => {
            // fundraiserCount = 0 olarak çağırıyoruz
            const factory = await createFundraiserFactory(0, accounts);

            const fundraisers = await factory.fundraisers(10, 0); 
            assert.equal(
                fundraisers.length,
                0,
                "collection should be empty"
            ); 
        });
    });

    describe("varying limits", async () => { 
        
        let factory;

        beforeEach(async () => {
            // we set limit to 30
            factory = await createFundraiserFactory(30, accounts);
          })
          
          // eğer istek limiti 10 olarak belirlenir ise 10 adet bağış dönecek 
          it("returns 10 results when limit requested is 10", async ()=>{ 
              const fundraisers = await factory.fundraisers(10, 0); 
              // fundraisers listesinin uzunluğu 10 olursa return yapacak
              assert.equal(
                fundraisers.length,
                10,
                "results size should be 10"
                );  
            });

            // xit marks the test as pending
            it("returns 20 results when limit requested is 20", async ()=>{ 
                const fundraisers = await factory.fundraisers(20, 0);
                assert.equal(
                    fundraisers.length,
                    20,
                    "results size should be 20"
                ); 
            });

            it("returns 20 results when limit requested is 30", async ()=>{ 
                const fundraisers = await factory.fundraisers(30, 0); 
                assert.equal(
                    fundraisers.length,
                    20,
                    "results size should be 20"
                ); 
            });
        });

    describe("varying offset", () => { 
        let factory;
        beforeEach(async () => {
            factory = await createFundraiserFactory(10, accounts);
        });

        it("contains the fundraiser with the appropriate offset", async ()=>{ 
            const fundraisers = await factory.fundraisers(1, 0);
            const fundraiser = await FundraiserContract.at(fundraisers[0]); 
            const name = await fundraiser.name();
            assert.ok(await name.includes(0), `${name} did not include the offset`);
        });

        xit("contains the fundraiser with the appropriate offset", async ()=>{ 
            const fundraisers = await factory.fundraisers(1, 7);
            const fundraiser = await FundraiserContract.at(fundraisers[0]); 
            const name = await fundraiser.name();
            assert.ok(await name.includes(7), `${name} did not include the offset`);
        });
    });
});
