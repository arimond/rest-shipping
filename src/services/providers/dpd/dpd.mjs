import util from "~util/util.mjs";
import axios from "axios";

async function getLabel(shippingData) {
    const options = {
        headers: {
            "Content-Type": "application/json",
            Version: 100,
            Language: "de_DE",
            "PartnerCredentials-Name": process.env.DPD_CREDENTIALS_NAME,
            "PartnerCredentials-Token": process.env.DPD_CREDENTIALS_TOKEN,
            "UserCredentials-cloudUserID": process.env.DPD_CLOUD_USER_ID,
            "UserCredentials-Token": process.env.DPD_USER_TOKEN
        }
    };

    const currentDate = new Date();

    if (currentDate.getDay() == 6) {
        currentDate.setDate(currentDate.getDate() + 2)
    }

    if (currentDate.getDay() == 0) {
        currentDate.setDate(currentDate.getDate() + 1)
    }
    const year = currentDate.getFullYear();
    const month = util.leftPadZero(currentDate.getMonth() + 1, 2);
    const day = util.leftPadZero(currentDate.getDate(), 2);
    const dateString = year + "-" + month + "-" + day;

    const json = {
        OrderAction: "startOrder",
        OrderSettings: {
            ShipDate: dateString,
            LabelSize: "PDF_A4",
            LabelStartPosition: "UpperLeft"
        },
        OrderDataList: [
            {
                ShipAddress: {
                    Company: shippingData.recipient.company,
                    Gender: "",
                    Salutation: "",
                    FirstName: shippingData.recipient.firstName,
                    LastName: shippingData.recipient.lastName,
                    Name: `${shippingData.recipient.firstName} ${shippingData.recipient.lastName}`,
                    Street: shippingData.recipient.street,
                    HouseNo: shippingData.recipient.streetNo,
                    ZipCode: shippingData.recipient.zip,
                    City: shippingData.recipient.city,
                    Country: shippingData.recipient.countryCode,
                    State: "",
                    Phone: shippingData.recipient.phone,
                    Mail: ""
                },
                ParcelData: {
                    YourInternalID: "Not used",
                    Content: "Clothing",
                    Weight: shippingData.parcel ? shippingData.parcel.weight : 0,
                    Reference1: "Not used",
                    // Reference2: "",
                    ShipService: "Classic"
                }
            }
        ]
    };

    return await axios
        .post(process.env.DPD_SHIPPING_API+ "/setOrder", json, options)
        .then((result) => {
            if (result.status === 200 && result.data.ErrorDataList === null) {
                const trackingNumber = result.data.LabelResponse.LabelDataList[0].ParcelNo;
                const labelContent = result.data.LabelResponse.LabelPDF;
                return {
                    trackingNumber,
                    labelContent
                };
            }
            throw JSON.stringify(result.data.ErrorDataList);
        })
}

export default { getLabel }