import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Image,
  Video,
  FileText,
  Upload,
  Search,
  Folder,
  Grid,
  List,
  MoreVertical,
  Trash2,
  Download,
  Tag,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MediaLibraryPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const folders = [
    { id: 1, name: "Black Friday 2024", count: 48 },
    { id: 2, name: "Natal", count: 32 },
    { id: 3, name: "Stories", count: 156 },
    { id: 4, name: "Produtos", count: 89 },
  ];

  const mediaItems = [
    { id: 1, name: "promo-001.jpg", type: "image", size: "2.4 MB", date: "2024-12-15" },
    { id: 2, name: "video-oferta.mp4", type: "video", size: "15.8 MB", date: "2024-12-14" },
    { id: 3, name: "catalogo.pdf", type: "document", size: "4.2 MB", date: "2024-12-13" },
    { id: 4, name: "banner-natal.png", type: "image", size: "1.8 MB", date: "2024-12-12" },
    { id: 5, name: "unboxing.mp4", type: "video", size: "28.4 MB", date: "2024-12-11" },
    { id: 6, name: "preco-lista.xlsx", type: "document", size: "156 KB", date: "2024-12-10" },
    { id: 7, name: "story-01.jpg", type: "image", size: "890 KB", date: "2024-12-09" },
    { id: 8, name: "review.mp4", type: "video", size: "42.1 MB", date: "2024-12-08" },
  ];

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="w-5 h-5 text-telegram" />;
      case "video":
        return <Video className="w-5 h-5 text-purple-400" />;
      case "document":
        return <FileText className="w-5 h-5 text-warning" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredMedia = mediaItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Biblioteca de Mídias</h1>
            <p className="text-muted-foreground">
              Organize e gerencie seus arquivos para campanhas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Tag className="w-4 h-4 mr-2" />
              Tags
            </Button>
            <Button variant="gradient">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Storage Usage */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Armazenamento usado</p>
                <p className="text-2xl font-bold">2.4 GB <span className="text-sm font-normal text-muted-foreground">/ 10 GB</span></p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-telegram" />
                  <span>Imagens: 1.2 GB</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-400" />
                  <span>Vídeos: 1.0 GB</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span>Documentos: 0.2 GB</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Folders Sidebar */}
          <Card className="glass-card lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pastas</CardTitle>
                <Button variant="ghost" size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <button className="w-full flex items-center gap-3 p-2 rounded-lg bg-telegram/10 text-telegram">
                  <Folder className="w-4 h-4" />
                  <span className="flex-1 text-left text-sm">Todos os arquivos</span>
                  <Badge variant="secondary">325</Badge>
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <Folder className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 text-left text-sm">{folder.name}</span>
                    <Badge variant="secondary">{folder.count}</Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar arquivos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
                <TabsList>
                  <TabsTrigger value="grid">
                    <Grid className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <List className="w-4 h-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {selectedItems.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.length} selecionados
                  </span>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Baixar
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              )}
            </div>

            {/* Media Grid/List */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMedia.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`glass-card overflow-hidden cursor-pointer group ${
                        selectedItems.includes(item.id) ? "ring-2 ring-telegram" : ""
                      }`}
                      onClick={() => toggleSelect(item.id)}
                    >
                      <div className="aspect-square bg-secondary/50 flex items-center justify-center relative">
                        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Checkbox checked={selectedItems.includes(item.id)} />
                        </div>
                        {item.type === "image" ? (
                          <div className="w-full h-full bg-gradient-to-br from-telegram/20 to-purple-500/20" />
                        ) : (
                          getMediaIcon(item.type)
                        )}
                        <div className="absolute top-2 right-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Baixar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Tag className="w-4 h-4 mr-2" />
                                Adicionar tag
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.size}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {filteredMedia.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-4 p-4 hover:bg-secondary/30 cursor-pointer ${
                          selectedItems.includes(item.id) ? "bg-telegram/10" : ""
                        }`}
                        onClick={() => toggleSelect(item.id)}
                      >
                        <Checkbox checked={selectedItems.includes(item.id)} />
                        <div className="p-2 rounded-lg bg-secondary/50">
                          {getMediaIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.date}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.size}</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Baixar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Tag className="w-4 h-4 mr-2" />
                              Adicionar tag
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MediaLibraryPage;
