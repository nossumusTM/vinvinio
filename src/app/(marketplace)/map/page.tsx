import getListings from '@/app/(marketplace)/actions/getListings';
import MapComponent from '@/app/(marketplace)/components/MapComponent';

const MapPage = async () => {
  const listings = await getListings({ take: 120 });

  return <MapComponent initialListings={listings} />;
};

export default MapPage;
