const axios = require("axios");

const DANANG_WARD_TO_DISTRICT = {
  "hoa xuan": "Cẩm Lệ",
  "hoa tho dong": "Cẩm Lệ",
  "hoa tho tay": "Cẩm Lệ",
  "khue trung": "Cẩm Lệ",
  "hoa cuong bac": "Hải Châu",
  "hoa cuong nam": "Hải Châu",
  "hai chau i": "Hải Châu",
  "hai chau ii": "Hải Châu",
  "thach thang": "Hải Châu",
  "phuoc ninh": "Hải Châu",
  "binh hien": "Hải Châu",
  "binh thuan": "Hải Châu",
  "nai hien dong": "Sơn Trà",
  "an hai bac": "Sơn Trà",
  "an hai dong": "Sơn Trà",
  "an hai tay": "Sơn Trà",
  "phuoc my": "Sơn Trà",
  "man thai": "Sơn Trà",
  "tho quang": "Sơn Trà",
  "thanh khe dong": "Thanh Khê",
  "thanh khe tay": "Thanh Khê",
  "vinh trung": "Thanh Khê",
  "thac gian": "Thanh Khê",
  "chinh gian": "Thanh Khê",
  "an khe": "Thanh Khê",
  "xuan ha": "Thanh Khê",
  "hoa minh": "Liên Chiểu",
  "hoa khanh bac": "Liên Chiểu",
  "hoa khanh nam": "Liên Chiểu",
  "hoa hiep bac": "Liên Chiểu",
  "hoa hiep nam": "Liên Chiểu",
  "my an": "Ngũ Hành Sơn",
  "khue my": "Ngũ Hành Sơn",
  "hoa hai": "Ngũ Hành Sơn",
  "hoa quy": "Ngũ Hành Sơn",
};

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function appendIfMissing(base, part) {
  if (!part) return base || "";

  const normalizedBase = normalizeText(base);
  const normalizedPart = normalizeText(part);

  if (normalizedBase.includes(normalizedPart)) {
    return base;
  }

  return base ? `${base}, ${part}` : part;
}

function stripVietnameseAdministrativePrefix(value = "") {
  return String(value)
    .replace(/^(phuong|xa|thi tran|quan|huyen|thanh pho|tp\.?)/i, "")
    .trim();
}

function getDanangDistrictByWard(wardName = "") {
  const normalizedWard = normalizeText(stripVietnameseAdministrativePrefix(wardName));
  return DANANG_WARD_TO_DISTRICT[normalizedWard] || "";
}

function dedupeAddressParts(parts = []) {
  const seen = new Set();
  const result = [];

  for (const part of parts) {
    if (!part) continue;

    const normalized = normalizeText(part);
    if (!normalized || seen.has(normalized)) continue;

    seen.add(normalized);
    result.push(part);
  }

  return result;
}

function formatAdministrativeAddress({ wardName = "", districtName = "", cityName = "", countryName = "Việt Nam" } = {}) {
  const normalizedCity = normalizeText(cityName);
  const normalizedWardRaw = normalizeText(wardName);
  const normalizedDistrictRaw = normalizeText(districtName);

  let normalizedDistrict = districtName;
  if (normalizedCity.includes("da nang")) {
    const correctedDistrict = getDanangDistrictByWard(wardName);
    if (correctedDistrict) {
      normalizedDistrict = correctedDistrict;
    } else if (
      normalizedWardRaw.startsWith("phuong ") &&
      normalizedDistrictRaw.includes("hoa vang")
    ) {
      // Hoa Vang is a rural district (xa/thi tran), so pair with urban ward labels is inconsistent.
      normalizedDistrict = "";
    }
  }

  const parts = dedupeAddressParts([
    wardName,
    normalizedDistrict,
    cityName,
    countryName,
  ]);

  return parts.join(", ");
}

function getBigDataCityName(data = {}) {
  const administrativeItems = Array.isArray(data.localityInfo?.administrative)
    ? data.localityInfo.administrative
    : [];

  const cityLike = administrativeItems
    .map((item) => item?.name)
    .find((name) => {
      const normalizedName = normalizeText(name || "");
      return (
        normalizedName.includes("thanh pho") ||
        normalizedName.includes("tp ") ||
        normalizedName.includes("city")
      );
    });

  return (
    data.city ||
    cityLike ||
    data.principalSubdivision ||
    data.localityInfo?.administrative?.[3]?.name ||
    ""
  );
}

function getReadableBigDataAddress(data = {}, lat, lon) {
  const informativeItems = Array.isArray(data.localityInfo?.informative)
    ? data.localityInfo.informative
    : [];

  const administrativeItems = Array.isArray(data.localityInfo?.administrative)
    ? data.localityInfo.administrative
    : [];

  const wardName =
    data.locality ||
    administrativeItems.find((item) => Number(item?.adminLevel) >= 6)?.name ||
    "";

  const districtNameFromInfo =
    informativeItems.find((item) => {
      const description = normalizeText(item?.description || "");
      const name = normalizeText(item?.name || "");
      return (
        description.includes("quan") ||
        description.includes("huyen") ||
        description.includes("thi xa") ||
        description.includes("thi tran") ||
        name.includes("quan ") ||
        name.includes("huyen ")
      );
    })?.name || "";

  const districtNameFromAdmin =
    administrativeItems.find((item) => Number(item?.adminLevel) === 5)?.name || "";

  const districtName = districtNameFromInfo || districtNameFromAdmin;

  const cityName = getBigDataCityName(data);
  const countryName = data.countryName || "Việt Nam";

  const address = formatAdministrativeAddress({
    wardName,
    districtName,
    cityName,
    countryName,
  });

  const fallbackAddress = `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`;

  return {
    address: address || fallbackAddress,
    fullAddress: address || fallbackAddress,
  };
}

function getReadableNominatimAddress(data = {}, lat, lon) {
  const addr = data.address || {};
  const wardName =
    addr.suburb ||
    addr.neighbourhood ||
    addr.quarter ||
    addr.hamlet ||
    "";

  const districtName = addr.city_district || addr.district || addr.county || "";

  const cityName =
    addr.city ||
    addr.town ||
    addr.municipality ||
    addr.state ||
    addr.province ||
    addr.county ||
    "";

  const houseAndRoad = [addr.house_number, addr.road || addr.street || addr.path]
    .filter(Boolean)
    .join(" ");

  const adminAddress = formatAdministrativeAddress({
    wardName,
    districtName,
    cityName,
    countryName: addr.country || "Việt Nam",
  });

  let address = dedupeAddressParts([houseAndRoad, adminAddress]).join(", ");
  if (!address) {
    address = data.display_name || `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`;
  }

  return {
    address,
    fullAddress: data.display_name || address,
  };
}

class GeocodeController {
  async reverseGeocode(req, res) {
    try {
      const { lat, lon } = req.query;

      if (!lat || !lon) {
        return res.status(400).json({
          success: false,
          message: "Thiếu tham số lat và lon",
        });
      }

      console.log(`🌍 Reverse geocoding: ${lat}, ${lon}`);

      // Ưu tiên Nominatim TRƯỚC — trả về địa chỉ chi tiết (số nhà, tên đường)
      try {
        console.log("🌍 Trying Nominatim API (detailed address)...");
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse`,
          {
            params: {
              format: "json",
              lat: lat,
              lon: lon,
              addressdetails: 1,
              zoom: 18, // Mức chi tiết cao nhất — lấy đến số nhà
              "accept-language": "vi",
            },
            headers: {
              "User-Agent": "ReportApp/1.0 (Contact: admin@example.com)",
            },
            timeout: 8000,
          }
        );

        const data = response.data;
        console.log("📡 Nominatim full response:", JSON.stringify(data, null, 2));

        if (data && data.address) {
          console.log("✅ Nominatim address:", data.address);
          const normalized = getReadableNominatimAddress(data, lat, lon);

          return res.status(200).json({
            success: true,
            data: {
              address: normalized.address,
              fullAddress: normalized.fullAddress,
              details: data.address,
              source: "nominatim",
            },
          });
        }
      } catch (nominatimError) {
        console.log("⚠️ Nominatim failed:", nominatimError.message);
      }

      // Fallback: BigDataCloud API — chỉ có địa chỉ hành chính (phường, quận, TP)
      try {
        console.log("🔍 Trying BigDataCloud API (fallback)...");
        const bigDataResponse = await axios.get(
          `https://api.bigdatacloud.net/data/reverse-geocode-client`,
          {
            params: {
              latitude: lat,
              longitude: lon,
              localityLanguage: "vi",
            },
            timeout: 5000,
          }
        );

        if (bigDataResponse.data) {
          const data = bigDataResponse.data;
          console.log("✅ BigDataCloud response:", data);

          const normalized = getReadableBigDataAddress(data, lat, lon);

          return res.status(200).json({
            success: true,
            data: {
              address: normalized.address,
              fullAddress: normalized.fullAddress,
              details: data,
              source: "bigdatacloud",
            },
          });
        }
      } catch (bigDataError) {
        console.log("⚠️ BigDataCloud failed:", bigDataError.message);
      }

      // Cả 2 API đều fail — trả về tọa độ
      return res.status(200).json({
        success: true,
        data: {
          address: `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`,
          fullAddress: "Không tìm thấy địa chỉ",
          source: "fallback",
        },
      });
    } catch (error) {
      console.error("❌ Geocode error:", error.message);
      const { lat, lon } = req.query;

      return res.status(200).json({
        success: true,
        data: {
          address: `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`,
          fullAddress: "Không thể lấy địa chỉ",
          error: error.message,
          source: "error",
        },
      });
    }
  }
}

module.exports = new GeocodeController();
