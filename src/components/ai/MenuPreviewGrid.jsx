import { useState } from 'react';
import { Download, AlertTriangle, Info, ShieldCheck, Leaf, Drumstick } from 'lucide-react';
import useMenuScannerStore from '@/store/menuScannerStore';

export default function MenuPreviewGrid({ onImportSuccess }) {
  const { parsedData, updateParsedItem, importMenu, isImporting, error } = useMenuScannerStore();
  
  if (!parsedData || !parsedData.categories) return null;

  const handleImport = async () => {
    try {
      await importMenu();
      onImportSuccess();
    } catch (e) {
      // Error handled by store
    }
  };

  const totalItems = parsedData.categories.reduce((acc, cat) => acc + (cat.items?.length || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between pb-4 border-b border-surface-100 dark:border-surface-800">
        <div>
          <h4 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            AI Extraction Successful
          </h4>
          <p className="text-sm text-surface-500 mt-1">
            Found {parsedData.categories.length} categories and {totalItems} items. Please review the extracted data before importing.
          </p>
        </div>
        <button 
          onClick={handleImport}
          disabled={isImporting || totalItems === 0}
          className="btn-primary"
        >
          {isImporting ? 'Importing Data...' : `Import ${totalItems} Items`}
        </button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/30 rounded-lg">
          {error}
        </div>
      )}

      <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {parsedData.categories.map((category, catIndex) => (
          <div key={catIndex} className="mb-8">
            <h5 className="text-base font-bold text-surface-900 dark:text-white mb-3 flex items-center gap-2 w-max">
              <input 
                type="text" 
                value={category.icon || '🍽️'} 
                onChange={(e) => {
                  const newData = { ...parsedData };
                  newData.categories[catIndex].icon = e.target.value;
                  useMenuScannerStore.setState({ parsedData: newData });
                }}
                className="w-10 text-center p-1.5 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 rounded-md outline-none transition-colors"
                title="Category Icon"
              />
              <input 
                type="text"
                value={category.name}
                onChange={(e) => {
                  const newData = { ...parsedData };
                  newData.categories[catIndex].name = e.target.value;
                  useMenuScannerStore.setState({ parsedData: newData });
                }}
                className="bg-transparent border border-transparent hover:border-surface-200 focus:border-primary-500 rounded outline-none px-2 py-1"
              />
            </h5>
            
            <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-50 dark:bg-surface-800/50 text-surface-500 font-medium">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center text-xl">✨</th>
                    <th className="px-4 py-3 w-1/4">Item Name</th>
                    <th className="px-4 py-3 w-1/3">Description</th>
                    <th className="px-4 py-3 w-24 text-right">Price</th>
                    <th className="px-4 py-3 w-24 text-center">Type</th>
                    <th className="px-4 py-3 w-20 text-center">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {category.items?.map((item, itemIndex) => (
                    <tr key={itemIndex} className="hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                      <td className="p-2 text-center">
                         <input 
                          type="text" 
                          value={item.image || '🍔'} 
                          onChange={(e) => updateParsedItem(catIndex, itemIndex, 'image', e.target.value)}
                          className="w-10 text-center px-1 py-1.5 bg-transparent border border-transparent hover:border-surface-200 focus:border-primary-500 rounded outline-none transition-colors text-lg"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={item.name} 
                          onChange={(e) => updateParsedItem(catIndex, itemIndex, 'name', e.target.value)}
                          className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-surface-200 focus:border-primary-500 rounded outline-none transition-colors dark:text-white"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={item.description || ''} 
                          onChange={(e) => updateParsedItem(catIndex, itemIndex, 'description', e.target.value)}
                          placeholder="No description"
                          className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-surface-200 focus:border-primary-500 rounded outline-none transition-colors dark:text-surface-300 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-400">₹</span>
                          <input 
                            type="number" 
                            value={item.price} 
                            onChange={(e) => updateParsedItem(catIndex, itemIndex, 'price', e.target.value)}
                            className="w-full pl-6 pr-2 py-1.5 text-right font-mono bg-transparent border border-transparent hover:border-surface-200 focus:border-primary-500 rounded outline-none transition-colors dark:text-white"
                          />
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => updateParsedItem(catIndex, itemIndex, 'veg', !item.veg)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-semibold ${
                            item.veg 
                              ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' 
                              : 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'
                          }`}
                        >
                          {item.veg ? <Leaf className="w-3 h-3" /> : <Drumstick className="w-3 h-3" />}
                          {item.veg ? 'Veg' : 'Non'}
                        </button>
                      </td>
                      <td className="p-2 text-center">
                         <div className="flex items-center justify-center gap-1.5">
                           {item.confidence < 80 && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                           <span className={`text-xs font-bold ${
                             item.confidence >= 90 ? 'text-emerald-500' :
                             item.confidence >= 80 ? 'text-amber-500' : 'text-red-500'
                           }`}>
                             {item.confidence || 100}%
                           </span>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {(!category.items || category.items.length === 0) && (
                    <tr>
                      <td colSpan="6" className="px-4 py-6 text-center text-surface-500 text-sm">
                        No items detected in this category
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold mb-1">How AI Formatting Works</p>
          <p className="opacity-90 leading-relaxed">Our multi-modal parser analyzes structural layout, grouping headers (categories) with their child elements (menu items). Prices are stripped of currency symbols and cast as numeric nodes. The Veg/Non-Veg classifier uses semantic keyword detection (e.g., matching "paneer" to vegan/veg taxonomy models). Note: Items with sub-80% confidence scores are flagged with <AlertTriangle className="w-3 h-3 inline text-amber-500 mx-1"/> — please verify their prices!</p>
        </div>
      </div>
    </div>
  );
}
