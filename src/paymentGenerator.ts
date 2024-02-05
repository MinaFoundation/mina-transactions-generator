import Client from 'mina-signer';

export async function paymentGenerator(
    network: string,
    deployerAccount: string,
    receivers: string[],
    noTransactions: number,
    timeDelayMS: number,
    amount: number,
    fee: number
) {
    if (noTransactions === -1) {
        while (true) {
            const receiver = receivers[Math.floor(Math.random() * receivers.length)];
            await processTransaction(network, deployerAccount, receiver, timeDelayMS, amount, fee);
        }
    } else {
        for (let i = 0; i < noTransactions; i++) {
            const receiver = receivers[Math.floor(Math.random() * receivers.length)];
            await processTransaction(network, deployerAccount, receiver, timeDelayMS, amount, fee);
        }
    }
}
async function processTransaction(
    network: string,
    deployerAccount: string,
    receiver: string,
    timeDelayMS: number,
    amount: number,
    fee: number
) {
    const client = new Client({ network: 'testnet' });
    let sender_public = client.derivePublicKey(deployerAccount)
    console.log("receiver: ", receiver);
    const query = `query MyQuery {
        account(publicKey: "${sender_public}") {
          inferredNonce
        }
      }`
    let response = await fetch(network, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            query: query
        }),
    })
    let inferred_nonce = parseInt((await response.json()).data.account.inferredNonce)
    let signedPayment = client.signPayment(
        {
            to: receiver,
            from: sender_public,
            amount: amount,
            fee: fee,
            nonce: inferred_nonce
        },
        deployerAccount
    );
    const query_pay = `mutation MyMutation {
        sendPayment(input: {fee: "${fee}",  amount: "${amount}", to: "${receiver}", from: "${sender_public}", nonce: "${inferred_nonce}"}, signature: {field: "${signedPayment.signature.field}", scalar: "${signedPayment.signature.scalar}"})}`;
    await fetch(network, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            query: query_pay
        }),
    })
        .then(r => r.json())
        .then(data => console.log("data returned:", data));
    await new Promise(r => setTimeout(r, timeDelayMS));
}
