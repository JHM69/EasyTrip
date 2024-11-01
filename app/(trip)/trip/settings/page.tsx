import BreadCrumb from "@/components/breadcrumb";  
import { ScrollArea } from "@/components/ui/scroll-area";

const breadcrumbItems = [{ title: "Settings", link: "/trip/setting" }];
export default function page() {
  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <BreadCrumb items={breadcrumbItems} />
           Setting Page 
           {/* TODO: Implement it later */}
      </div>
    </ScrollArea>
  );
}
