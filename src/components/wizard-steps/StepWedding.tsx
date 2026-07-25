import React, { useState, useEffect, useRef } from "react";
import { useWizardStore } from "@/lib/store";
import { uploadFile } from "@/lib/compress";
import { Trash2, MapPin, Search, Sparkles, X, Check, ExternalLink, Loader2, Building2 } from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function StepWedding() {
  const { data, updateNestedData, setData } = useWizardStore();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Google Maps Selection & Autocomplete Search State
  const [showMapModal, setShowMapModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);

  const autocompleteInputRef = useRef<HTMLInputElement | null>(null);
  const googleMapContainerRef = useRef<HTMLDivElement | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // 1. Dynamically load Google Maps JavaScript API if API Key is configured
  useEffect(() => {
    if (!googleMapsApiKey) return;
    if (window.google?.maps?.places) {
      setGoogleMapsLoaded(true);
      return;
    }

    const scriptId = "google-maps-js-sdk";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleMapsLoaded(true);
      document.head.appendChild(script);
    } else {
      setGoogleMapsLoaded(true);
    }
  }, []);

  // 2. Initialize Native Google Places Autocomplete & Interactive Map if Google API Key is present
  useEffect(() => {
    if (!showMapModal || !googleMapsLoaded || !autocompleteInputRef.current || !window.google?.maps?.places) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, {
        types: ["establishment", "geocode"],
      });

      // Default map options
      const mapOptions = {
        zoom: 15,
        center: { lat: 10.5276, lng: 76.2144 }, // Default Thrissur / Kerala center
        mapTypeControl: false,
      };

      let map: any = null;
      let marker: any = null;

      if (googleMapContainerRef.current) {
        map = new window.google.maps.Map(googleMapContainerRef.current, mapOptions);
        marker = new window.google.maps.Marker({
          map,
          draggable: true,
          title: "Drag to pin exact venue location",
        });

        // Listen to marker drag end event to get exact coordinates & Google Maps link
        marker.addListener("dragend", () => {
          const position = marker.getPosition();
          if (position) {
            const lat = position.lat();
            const lng = position.lng();
            const url = `https://www.google.com/maps?q=${lat},${lng}`;
            setSelectedPlace((prev: any) => ({
              ...prev,
              display_name: prev?.display_name || searchQuery || "Pinned Location",
              mapUrl: url,
              lat,
              lng,
            }));
          }
        });
      }

      // Listen to place selection from Google Autocomplete
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const mapUrl = place.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name || place.formatted_address)}`;

        if (map && marker) {
          map.setCenter(place.geometry.location);
          map.setZoom(17);
          marker.setPosition(place.geometry.location);
        }

        const placeObj = {
          name: place.name,
          display_name: place.formatted_address || place.name,
          mapUrl,
          lat,
          lng,
          photos: place.photos,
          address_components: place.address_components,
        };

        setSelectedPlace(placeObj);
        setSearchQuery(place.name || place.formatted_address);
      });
    } catch (err) {
      console.error("Failed to initialize Google Maps Places SDK:", err);
    }
  }, [showMapModal, googleMapsLoaded]);

  // 3. Multi-Engine Auditorium & POI Search (Photon POI API + Nominatim API)
  useEffect(() => {
    if (googleMapsLoaded) return; // Skip if native Google Maps SDK is active
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const rawQuery = searchQuery.trim();
        const combinedResults: any[] = [];
        const seenKeys = new Set<string>();

        // Query 1: Photon POI API (Highly accurate for auditoriums, halls, churches, landmarks)
        const photonPromise = fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(rawQuery)}&limit=8`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.features) {
              data.features.forEach((feat: any) => {
                const props = feat.properties || {};
                const coords = feat.geometry?.coordinates || [];
                const name = props.name;
                if (!name) return;

                const city = props.city || props.town || props.village || props.county || props.state || "";
                const street = props.street || props.district || "";
                const display_name = [name, street, city, props.country].filter(Boolean).join(", ");
                const key = `${name.toLowerCase()}-${city.toLowerCase()}`;

                if (!seenKeys.has(key)) {
                  seenKeys.add(key);
                  combinedResults.push({
                    name,
                    display_name,
                    lat: coords[1],
                    lon: coords[0],
                    category: props.osm_value || props.osm_key || "venue",
                    address: {
                      city,
                      road: street,
                    },
                  });
                }
              });
            }
          })
          .catch(() => {});

        // Query 2: Nominatim API with POI search
        const nominatimPromise = fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rawQuery)}&addressdetails=1&limit=8&dedupe=1`
        )
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (Array.isArray(data)) {
              data.forEach((item: any) => {
                const name = item.name || item.display_name.split(",")[0];
                const key = `${name.toLowerCase()}-${(item.address?.city || "").toLowerCase()}`;

                if (!seenKeys.has(key)) {
                  seenKeys.add(key);
                  combinedResults.push({
                    name,
                    display_name: item.display_name,
                    lat: item.lat,
                    lon: item.lon,
                    category: item.type || item.category || "venue",
                    address: item.address,
                  });
                }
              });
            }
          })
          .catch(() => {});

        await Promise.allSettled([photonPromise, nominatimPromise]);

        // Prioritize auditoriums, halls, churches, convention centers, and resorts
        const poiKeywords = ["auditorium", "hall", "church", "cathedral", "shrine", "convention", "palace", "resort", "hotel", "place_of_worship", "building"];
        combinedResults.sort((a, b) => {
          const aStr = (a.name + " " + a.category + " " + a.display_name).toLowerCase();
          const bStr = (b.name + " " + b.category + " " + b.display_name).toLowerCase();

          const aMatch = poiKeywords.some((k) => aStr.includes(k)) ? -1 : 1;
          const bMatch = poiKeywords.some((k) => bStr.includes(k)) ? -1 : 1;
          return aMatch - bMatch;
        });

        setSearchResults(combinedResults.slice(0, 8));
      } catch (err) {
        console.error("Location search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, googleMapsLoaded]);

  if (!data) return null;

  const handleVenuePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const { url } = await uploadFile(file, (percent) => setProgress(percent));
      updateNestedData("wedding", {
        venue: {
          ...data.wedding.venue,
          photo: url,
        },
      });
    } catch (err) {
      alert("Failed to upload venue photo. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleVenueChange = (fields: any) => {
    updateNestedData("wedding", {
      venue: {
        ...data.wedding.venue,
        ...fields,
      },
    });
  };

  const timezones = [
    "Asia/Kolkata",
    "Europe/London",
    "America/New_York",
    "America/Los_Angeles",
    "Asia/Dubai",
    "Asia/Singapore",
  ];

  // Auto-Extract Venue Photo State
  const [extractingImage, setExtractingImage] = useState(false);
  const [extractedPhotos, setExtractedPhotos] = useState<string[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const handleAutoExtractVenueImage = async () => {
    const venueQuery = [data.wedding.venue.name, data.wedding.venue.city].filter(Boolean).join(" ");
    if (!venueQuery.trim()) {
      alert("Please enter a Venue Name or City first to extract photos.");
      return;
    }

    setExtractingImage(true);
    const photos: string[] = [];

    try {
      // 1. Google Places Photos (If Google Maps SDK is active and place has photos)
      if (selectedPlace?.photos && Array.isArray(selectedPlace.photos)) {
        selectedPlace.photos.slice(0, 4).forEach((p: any) => {
          if (typeof p.getUrl === "function") {
            photos.push(p.getUrl({ maxWidth: 1200, maxHeight: 800 }));
          }
        });
      }

      // 2. Real Wikimedia Commons Photographs for the exact venue name
      const wikiRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
          venueQuery
        )}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url&format=json&origin=*`
      );
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        if (wikiData?.query?.pages) {
          Object.values(wikiData.query.pages).forEach((page: any) => {
            const imgUrl = page.imageinfo?.[0]?.url;
            if (imgUrl && (imgUrl.endsWith(".jpg") || imgUrl.endsWith(".jpeg") || imgUrl.endsWith(".webp") || imgUrl.endsWith(".png"))) {
              photos.push(imgUrl);
            }
          });
        }
      }

      // Fallback Wikimedia Search by Wikipedia Article
      if (photos.length < 2) {
        const enWikiRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
            venueQuery
          )}&gsrlimit=6&prop=pageimages&piprop=original&format=json&origin=*`
        );
        if (enWikiRes.ok) {
          const enWikiData = await enWikiRes.json();
          if (enWikiData?.query?.pages) {
            Object.values(enWikiData.query.pages).forEach((page: any) => {
              if (page.original?.source) {
                photos.push(page.original.source);
              }
            });
          }
        }
      }

      // 3. Real High-Res Satellite / Aerial / Street View Snapshot of Venue Coordinates (if lat, lon present)
      let lat = selectedPlace?.lat;
      let lon = selectedPlace?.lon;

      if (!lat && searchQuery.trim()) {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(venueQuery)}&limit=1`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData?.[0]) {
              lat = geoData[0].lat;
              lon = geoData[0].lon;
            }
          }
        } catch (e) {
          console.error("Geocoding failed for real image snapshot:", e);
        }
      }

      if (lat && lon) {
        // High-definition real Satellite building snapshot
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (mapboxToken) {
          photos.unshift(
            `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lon},${lat},17,0/800x500?access_token=${mapboxToken}`
          );
        }
      }
    } catch (err) {
      console.error("Real venue photo extraction failed:", err);
    }

    const uniquePhotos = Array.from(new Set(photos)).slice(0, 8);
    setExtractedPhotos(uniquePhotos);
    setExtractingImage(false);

    if (uniquePhotos.length > 0) {
      setShowImageModal(true);
    } else {
      alert("No real photographs found for this venue online. Please upload a photo manually.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#eae6df] pb-4">
        <h2 className="text-xl font-serif font-bold text-[#1a1a1a]">Step 2 — Date & Venue</h2>
        <p className="text-xs text-[#666]">Enter the date, time, and main location for your wedding</p>
      </div>

      <div className="bg-white border border-[#eae6df] rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
        <h3 className="font-serif text-lg font-semibold text-[#855f18] border-b border-[#faf8f5] pb-2">
          Date &amp; Time Settings
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#777] mb-1">
              Wedding Date
            </label>
            <input
              type="date"
              value={data.wedding.date}
              onChange={(e) => updateNestedData("wedding", { date: e.target.value })}
              className="w-full px-2.5 py-2 border border-[#eae6df] rounded bg-white text-xs text-[#1a1a1a] focus:outline-none focus:border-[#855f18]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#777] mb-1">
              Time (24h)
            </label>
            <input
              type="time"
              value={data.wedding.time}
              onChange={(e) => updateNestedData("wedding", { time: e.target.value })}
              className="w-full px-2.5 py-2 border border-[#eae6df] rounded bg-white text-xs text-[#1a1a1a] focus:outline-none focus:border-[#855f18]"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#777] mb-1">
              Timezone
            </label>
            <select
              value={data.wedding.timezone}
              onChange={(e) => updateNestedData("wedding", { timezone: e.target.value })}
              className="w-full px-2.5 py-2 border border-[#eae6df] rounded bg-white text-xs text-[#1a1a1a] focus:outline-none focus:border-[#855f18]"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#eae6df] rounded-xl p-5 space-y-4 shadow-sm">
        <h3 className="font-serif text-lg font-semibold text-[#855f18] border-b border-[#faf8f5] pb-2">Venue Location</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Venue Name</label>
            <input
              type="text"
              value={data.wedding.venue.name}
              onChange={(e) => handleVenueChange({ name: e.target.value })}
              className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
              placeholder="Infant Jesus Church"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">City</label>
            <input
              type="text"
              value={data.wedding.venue.city}
              onChange={(e) => handleVenueChange({ city: e.target.value })}
              className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
              placeholder="Thrissur, Kerala"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Address</label>
          <input
            type="text"
            value={data.wedding.venue.address}
            onChange={(e) => handleVenueChange({ address: e.target.value })}
            className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
            placeholder="Church Road, High Street"
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
            <label className="block text-[10px] font-bold uppercase text-[#777]">Google Maps link (URL)</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const defaultQuery = [data.wedding.venue.name, data.wedding.venue.address, data.wedding.venue.city].filter(Boolean).join(", ");
                  setSearchQuery(defaultQuery);
                  setShowMapModal(true);
                }}
                className="text-[10px] font-extrabold text-[#855f18] flex items-center gap-1 bg-[#855f18]/10 hover:bg-[#855f18]/20 px-2.5 py-1 rounded-lg border border-[#855f18]/25 active:scale-95 transition-all cursor-pointer"
              >
                <MapPin className="w-3 h-3 text-[#855f18]" /> Select from Google Maps
              </button>

              {(data.wedding.venue.name || data.wedding.venue.address || data.wedding.venue.city) && (
                <button
                  type="button"
                  onClick={() => {
                    const query = [data.wedding.venue.name, data.wedding.venue.address, data.wedding.venue.city].filter(Boolean).join(" ");
                    handleVenueChange({
                      mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
                    });
                  }}
                  className="text-[10px] font-extrabold text-[#855f18] flex items-center gap-1 bg-white hover:bg-[#faf8f5] px-2 py-1 rounded-lg border border-[#eae6df] active:scale-95 transition-all cursor-pointer"
                  title="Auto-create map link from venue name, address & city"
                >
                  <Sparkles className="w-3 h-3 text-[#855f18]" /> Auto-Link
                </button>
              )}
            </div>
          </div>

          <div className="relative flex items-center">
            <input
              type="url"
              value={data.wedding.venue.mapUrl || ""}
              onChange={(e) => handleVenueChange({ mapUrl: e.target.value })}
              className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18] pr-8"
              placeholder="https://maps.app.goo.gl/... or click 'Select from Google Maps'"
            />
            {data.wedding.venue.mapUrl && (
              <a
                href={data.wedding.venue.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-2.5 text-[#855f18] hover:text-[#6c4c12]"
                title="Open Map Link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Interactive Google Maps Venue Search & Select Modal */}
        {showMapModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-[#eae6df] animate-in fade-in zoom-in-95 duration-200 relative">
              <div className="flex items-center justify-between border-b border-[#eae6df] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#855f18]/10 flex items-center justify-center text-[#855f18]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">Search &amp; Select Venue</h3>
                    <p className="text-[11px] text-[#666]">Type auditorium, church, or venue name to search &amp; auto-fill map</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  className="text-[#888] hover:text-[#1a1a1a] p-1 rounded-lg hover:bg-[#faf8f5]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#777]">
                  Search Auditorium / Venue / City
                </label>
                <div className="relative">
                  <input
                    ref={autocompleteInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedPlace(null);
                    }}
                    placeholder="Type venue name e.g. Infant Jesus Church, Thrissur"
                    className="w-full pl-9 pr-8 py-2.5 border border-[#eae6df] rounded-xl text-xs bg-white text-[#1a1a1a] focus:outline-none focus:border-[#855f18]"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-[#888] absolute left-3 top-3" />
                  {searching && (
                    <Loader2 className="w-4 h-4 text-[#855f18] absolute right-3 top-3 animate-spin" />
                  )}
                </div>

                {/* Interactive Matching Venue Selection Cards (Fallback when no Google Maps API key) */}
                {!googleMapsLoaded && searchResults.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#855f18]">
                        Tap one of the {searchResults.length} places below to select:
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {searchResults.map((item, idx) => {
                        const isSelected = selectedPlace?.display_name === item.display_name;
                        const placeName = item.name || item.display_name.split(",")[0];

                        const catLower = (item.category || item.display_name).toLowerCase();
                        let badgeText = "📍 Location";
                        if (catLower.includes("auditorium") || catLower.includes("hall") || catLower.includes("convention") || catLower.includes("palace")) {
                          badgeText = "🏛️ Auditorium / Hall";
                        } else if (catLower.includes("church") || catLower.includes("cathedral") || catLower.includes("shrine") || catLower.includes("worship")) {
                          badgeText = "⛪ Church / Cathedral";
                        } else if (catLower.includes("resort") || catLower.includes("hotel")) {
                          badgeText = "🏨 Resort / Venue";
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedPlace(item);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                              isSelected
                                ? "bg-[#855f18] text-white border-[#855f18] shadow-md ring-2 ring-[#855f18]/20"
                                : "bg-white border-[#eae6df] hover:border-[#855f18]/50 hover:bg-[#faf8f5] text-[#1a1a1a]"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                isSelected ? "bg-white/20 text-white" : "bg-[#855f18]/10 text-[#855f18]"
                              }`}
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <p className={`font-bold truncate ${isSelected ? "text-white" : "text-[#1a1a1a]"}`}>
                                    {idx + 1}. {placeName}
                                  </p>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold flex-shrink-0 ${
                                    isSelected ? "bg-white/20 text-white" : "bg-[#855f18]/10 text-[#855f18]"
                                  }`}>
                                    {badgeText}
                                  </span>
                                </div>
                                {isSelected && (
                                  <span className="text-[9px] font-extrabold bg-white text-[#855f18] px-2 py-0.5 rounded-full flex items-center gap-0.5 flex-shrink-0">
                                    <Check className="w-3 h-3" /> Selected
                                  </span>
                                )}
                              </div>
                              <p className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-white/80" : "text-[#666]"}`}>
                                {item.display_name}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Live Embedded Google Map Preview */}
                <div className="w-full h-48 rounded-xl overflow-hidden border border-[#eae6df] bg-[#faf8f5] relative shadow-inner">
                  {searchQuery.trim() ? (
                    <>
                      <iframe
                        key={selectedPlace ? `${selectedPlace.lat}-${selectedPlace.lon}` : searchQuery}
                        title="Google Maps Location Search"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        src={
                          selectedPlace && selectedPlace.lat && selectedPlace.lon
                            ? `https://maps.google.com/maps?q=${selectedPlace.lat},${selectedPlace.lon}&z=16&output=embed`
                            : `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery)}&output=embed`
                        }
                      />
                      <div className="absolute top-2 left-2 z-20 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-extrabold text-[#855f18] border border-[#855f18]/25 shadow-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#855f18]" />{" "}
                        {selectedPlace
                          ? `Pinned: ${selectedPlace.name || selectedPlace.display_name.split(",")[0]}`
                          : "Location Pinned"}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#888] p-4 text-center">
                      <Building2 className="w-8 h-8 text-[#855f18]/40 mb-2" />
                      <p className="text-xs font-medium">Type venue or auditorium name above to view matching results</p>
                    </div>
                  )}
                </div>

                {/* Direct Open Link */}
                <div className="flex justify-end">
                  <a
                    href={
                      selectedPlace && selectedPlace.lat && selectedPlace.lon
                        ? `https://www.google.com/maps?q=${selectedPlace.lat},${selectedPlace.lon}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery.trim() || "Wedding Venue")}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#855f18] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Open in Google Maps App</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eae6df]">
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  className="px-4 py-2 border border-[#eae6df] text-xs font-bold text-[#666] rounded-xl hover:bg-[#faf8f5]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!searchQuery.trim()}
                  onClick={() => {
                    const placeName = selectedPlace
                      ? (selectedPlace.name || selectedPlace.display_name.split(",")[0].trim())
                      : searchQuery.split(",")[0].trim();
                    
                    const fullQuery = selectedPlace ? selectedPlace.display_name : searchQuery.trim();
                    const mapUrl = selectedPlace && selectedPlace.lat && selectedPlace.lon
                      ? `https://www.google.com/maps?q=${selectedPlace.lat},${selectedPlace.lon}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullQuery)}`;

                    // Extract city & address if available
                    let city = data.wedding.venue.city;
                    let address = data.wedding.venue.address;

                    if (selectedPlace) {
                      if (selectedPlace.address) {
                        const addr = selectedPlace.address;
                        city = addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.state_district || city;
                        address = [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(", ") || address;
                      } else {
                        const parts = selectedPlace.display_name.split(",");
                        if (parts.length > 1) {
                          city = parts.slice(1, 3).join(", ").trim();
                        }
                      }
                    }

                    handleVenueChange({
                      mapUrl,
                      name: placeName || data.wedding.venue.name,
                      city,
                      address,
                    });
                    setShowMapModal(false);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-[#855f18] to-[#6c4c12] text-white text-xs font-bold rounded-xl disabled:opacity-40 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm &amp; Apply Venue</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-bold uppercase text-[#777]">Venue Cover Image</label>
            <button
              type="button"
              disabled={extractingImage || (!data.wedding.venue.name && !data.wedding.venue.city)}
              onClick={handleAutoExtractVenueImage}
              className="text-[10px] font-extrabold text-[#855f18] flex items-center gap-1 bg-[#855f18]/10 hover:bg-[#855f18]/20 px-2.5 py-1 rounded-lg border border-[#855f18]/25 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
              title="Extract venue photo automatically from web"
            >
              {extractingImage ? (
                <>
                  <Loader2 className="w-3 h-3 text-[#855f18] animate-spin" />
                  <span>Extracting Photo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-[#855f18]" />
                  <span>Auto-Extract Venue Photo</span>
                </>
              )}
            </button>
          </div>

          {data.wedding.venue.photo ? (
            <div className="relative w-full h-36 rounded-lg overflow-hidden border border-[#eae6df] group mb-2 shadow-xs">
              <img src={data.wedding.venue.photo} alt="Venue Cover" className="w-full h-full object-cover" />
              
              {/* Top-Right Always-Visible Remove Trash Button */}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to remove this venue cover image?")) {
                    handleVenueChange({ photo: "" });
                  }
                }}
                className="absolute top-2.5 right-2.5 z-20 bg-red-600/90 hover:bg-red-700 text-white p-2 rounded-full active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 text-xs font-bold"
                title="Remove Venue Image"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Remove</span>
              </button>

              {/* Desktop Hover Dark Overlay */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleVenuePhotoUpload}
                className="w-full text-xs text-[#777] file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#855f18]/10 file:text-[#855f18] hover:file:bg-[#855f18]/20 file:cursor-pointer"
              />
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="url"
                  placeholder="Or paste image URL from Justdial, Google, or Venue Website"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#eae6df] rounded text-xs text-[#1a1a1a] focus:outline-none focus:border-[#855f18]"
                />
                <button
                  type="button"
                  disabled={!imageUrlInput.trim()}
                  onClick={() => {
                    if (imageUrlInput.trim()) {
                      handleVenueChange({ photo: imageUrlInput.trim() });
                      setImageUrlInput("");
                    }
                  }}
                  className="px-3 py-1.5 bg-[#855f18] hover:bg-[#6c4c12] disabled:opacity-40 text-white text-xs font-bold rounded-lg whitespace-nowrap active:scale-95 transition-all cursor-pointer"
                >
                  Apply URL
                </button>
              </div>
            </div>
          )}
          {uploading && <p className="text-[10px] text-[#855f18] mt-1">Uploading: {progress}%</p>}
        </div>
      </div>

      {/* Extracted Venue Photos Selection Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl border border-[#eae6df] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#eae6df] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#855f18]/10 flex items-center justify-center text-[#855f18]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">Extracted Venue Photos</h3>
                  <p className="text-[11px] text-[#666]">Select a photo for {data.wedding.venue.name || "your venue"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="text-[#888] hover:text-[#1a1a1a] p-1 rounded-lg hover:bg-[#faf8f5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
              {extractedPhotos.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    handleVenueChange({ photo: url });
                    setShowImageModal(false);
                  }}
                  className="group relative h-28 rounded-xl overflow-hidden border border-[#eae6df] hover:border-[#855f18] hover:ring-2 hover:ring-[#855f18]/30 transition-all shadow-xs cursor-pointer"
                >
                  <img src={url} alt={`Venue option ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold transition-opacity">
                    <span>Use This Photo</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
